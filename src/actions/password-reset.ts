"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createResetToken, verifyResetToken } from "@/lib/reset-token";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

async function getIp() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

export async function forgotPasswordAction(email: string) {
  const ip = await getIp();
  const rl = await rateLimit(`forgot:${ip}`, { limit: 3, windowMs: 60000 });
  if (!rl.success) {
    return { error: "Too many attempts. Please try again later." };
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return { success: true };
  }

  const token = await createResetToken(email.toLowerCase());
  if (!token) {
    logger.warn("Password reset skipped — Redis not available");
    return { success: true };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;
    await resend.emails.send({
      from: `Goodie Box <${process.env.RESEND_FROM_EMAIL ?? "orders@goodiebox.store"}>`,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h1 style="color:#e91e8c">Reset Your Password</h1>
          <p>Click the button below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#e91e8c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
          <p style="color:#666;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  }

  return { success: true };
}

export async function resetPasswordAction(token: string, password: string) {
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const email = await verifyResetToken(token);
  if (!email) {
    return { error: "Invalid or expired reset link" };
  }

  const passwordHash = await hashPassword(password);
  await db.user.update({
    where: { email },
    data: { passwordHash },
  });

  logger.info("Password reset completed", { email });
  return { success: true };
}
