"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, signIn } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { createVerifyEmailToken, verifyEmailToken } from "@/lib/verify-email-token";
import { auditLog } from "@/lib/audit";
import { Resend } from "resend";
import { AuthError } from "next-auth";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";

async function getRateLimitIdentifier() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

export async function signupAction(formData: FormData) {
  const ip = await getRateLimitIdentifier();
  const rl = await rateLimit(`signup:${ip}`, { limit: 10, windowMs: 60000 });
  if (!rl.success) {
    return { error: { root: ["Too many attempts. Please try again later."] } };
  }

  const turnstileToken = formData.get("turnstileToken") as string;
  if (!turnstileToken) {
    return { error: { root: ["Please complete the security check"] } };
  }
  const validCaptcha = await verifyTurnstile(turnstileToken);
  if (!validCaptcha) {
    return { error: { root: ["Security check failed. Please try again."] } };
  }

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    role: "CUSTOMER",
  };

  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  let existing;
  try {
    existing = await db.user.findUnique({
      where: { email: parsed.data.email },
    });
  } catch (error) {
    logger.error("Signup database lookup failed", error, { email: parsed.data.email });
    return { error: { root: ["Database unavailable. Please try again later."] } };
  }
  if (existing) {
    return { error: { email: ["An account with this email already exists. <a href='/resend-verification' class='underline'>Resend verification</a>"] } };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  let newUser;
  try {
    newUser = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
        profile: { create: {} },
        cart: { create: {} },
      },
    });
  } catch (error) {
    logger.error("Signup user creation failed", error, { email: parsed.data.email });
    return { error: { root: ["Account creation failed. Please try again later."] } };
  }

  await auditLog({
    action: "SIGNUP",
    entity: "User",
    entityId: newUser.id,
    metadata: { email: parsed.data.email, name: parsed.data.name, ip },
    ip,
  });

  const token = await createVerifyEmailToken(newUser.id);
  if (token) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`;
        await resend.emails.send({
          from: `Goodie Box <${process.env.RESEND_FROM_EMAIL ?? "orders@goodieboxstore.online"}>`,
          to: parsed.data.email,
          subject: "Verify your email address",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h1 style="color:#e91e8c">Welcome to Goodie Box!</h1>
              <p>Click the button below to verify your email address and activate your account.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#e91e8c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Verify Email</a>
              <p style="color:#666;font-size:14px">This link expires in 24 hours.</p>
            </div>
          `,
        });
      } catch (error) {
        logger.error("Failed to send verification email", error, { email: parsed.data.email });
      }
    }
  }

  revalidatePath("/");
  return { success: true, needsVerification: true };
}

export async function verifyEmailAction(token: string) {
  const userId = await verifyEmailToken(token);
  if (!userId) {
    return { error: "Invalid or expired verification link." };
  }

  try {
    await db.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
  } catch (error) {
    logger.error("Email verification failed", error, { userId });
    return { error: "Verification failed. Please try again." };
  }

  await auditLog({
    action: "EMAIL_VERIFIED",
    entity: "User",
    entityId: userId,
  });

  revalidatePath("/");
  return { success: true };
}

export async function resendVerificationAction(email: string) {
  const ip = await getRateLimitIdentifier();
  const rl = await rateLimit(`resend-verify:${ip}`, { limit: 5, windowMs: 60000 });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again later." };
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.emailVerified) {
    return { success: true };
  }

  const token = await createVerifyEmailToken(user.id);
  if (token) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email/${token}`;
        await resend.emails.send({
          from: `Goodie Box <${process.env.RESEND_FROM_EMAIL ?? "orders@goodieboxstore.online"}>`,
          to: email,
          subject: "Verify your email address",
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h1 style="color:#e91e8c">Verify Your Email</h1>
              <p>Click the button below to verify your email address.</p>
              <a href="${verifyUrl}" style="display:inline-block;background:#e91e8c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Verify Email</a>
              <p style="color:#666;font-size:14px">This link expires in 24 hours.</p>
            </div>
          `,
        });
      } catch (error) {
        logger.error("Failed to resend verification email", error, { email });
      }
    }
  }

  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const ip = await getRateLimitIdentifier();
  const rl = await rateLimit(`login:${ip}`, { limit: 5, windowMs: 60000 });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again later." };
  }
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirect: false });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }
}
