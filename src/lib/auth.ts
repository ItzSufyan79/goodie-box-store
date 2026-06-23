import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: { strategy: "jwt" },
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = String(credentials.email).toLowerCase();
        const password = String(credentials.password);

        let user;
        try {
          user = await db.user.findUnique({
            where: { email },
          });
        } catch (error) {
          logger.error("Credential login database error", error, { email });
          return null;
        }

        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
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
