import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import WebAuthn from "next-auth/providers/webauthn";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { adapter } from "@/lib/auth-adapter";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { auditLog } from "@/lib/audit";
import { verify2FASession } from "@/lib/2fa-session";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: Role;
    };
  }

  interface User {
    role: Role;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

export const authSecret = process.env.AUTH_SECRET;

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

function getIp(request?: Request): string {
  if (!request) return "unknown";
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  adapter,
  session: { strategy: "jwt" },
  experimental: { enableWebAuthn: true },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email) return null;

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);
        const ip = getIp(request);

        // Support 2FA auth tokens (skip password + 2FA check)
        const authToken = String((credentials as Record<string, unknown>).authToken ?? "");
        if (authToken) {
          const userId = await verify2FASession(authToken);
          if (!userId) return null;
          const user = await db.user.findUnique({ where: { id: userId } });
          if (!user) return null;
          await auditLog({
            action: "LOGIN_SUCCESS",
            entity: "User",
            entityId: user.id,
            metadata: { email, ip, method: "2fa" },
            ip,
          });
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        }

        if (!password) return null;

        // Rate limit by IP
        const rl = await rateLimit(`login:${ip}`, { limit: 10, windowMs: 60000 });
        if (!rl.success) {
          logger.warn("Login rate limited by IP", { email, ip });
          return null;
        }

        // Verify Turnstile CAPTCHA
        const turnstileToken = String((credentials as Record<string, unknown>).turnstileToken ?? "");
        if (!turnstileToken) {
          logger.warn("Login missing CAPTCHA token", { email, ip });
          return null;
        }
        const validCaptcha = await verifyTurnstile(turnstileToken);
        if (!validCaptcha) {
          logger.warn("Login CAPTCHA verification failed", { email, ip });
          return null;
        }

        let user;
        try {
          user = await db.user.findUnique({ where: { email } });
        } catch (error) {
          logger.error("Credential login database error", error, { email });
          return null;
        }
        if (!user?.passwordHash) return null;

        // Check email verified
        if (!user.emailVerified) {
          logger.warn("Login blocked — email not verified", { email, ip });
          return null;
        }

        // If 2FA is enabled, reject direct password login (must use 2FA flow)
        if (user.twoFactorEnabled) {
          logger.warn("Login blocked — 2FA required", { email, ip });
          return null;
        }

        // Check lockout
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
          logger.warn("Login blocked — account locked", { email, ip });
          await auditLog({
            action: "LOGIN_BLOCKED_LOCKOUT",
            entity: "User",
            entityId: user.id,
            metadata: { email, ip },
            ip,
          });
          return null;
        }

        const valid = await compare(password, user.passwordHash);
        if (!valid) {
          // Increment failed attempts
          const newCount = user.failedLoginAttempts + 1;
          const updates: { failedLoginAttempts: number; lockoutUntil?: Date } = { failedLoginAttempts: newCount };
          if (newCount >= MAX_FAILED_ATTEMPTS) {
            updates.lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
            logger.warn("Account locked due to failed attempts", { email, ip, attempts: newCount });
            await auditLog({
              action: "ACCOUNT_LOCKED",
              entity: "User",
              entityId: user.id,
              metadata: { email, ip, attempts: newCount },
              ip,
            });
          }
          await db.user.update({ where: { id: user.id }, data: updates });
          return null;
        }

        // Successful login — reset failures
        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
          await db.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockoutUntil: null },
          });
        }

        await auditLog({
          action: "LOGIN_SUCCESS",
          entity: "User",
          entityId: user.id,
          metadata: { email, ip },
          ip,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    WebAuthn({
      relayingParty: {
        id: process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "").split(":")[0] ?? "localhost",
        name: "Goodie Box Store",
      },
      enableConditionalUI: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export function requireRole(userRole: Role, allowed: Role[]) {
  return allowed.includes(userRole);
}
