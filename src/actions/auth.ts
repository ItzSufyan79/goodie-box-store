"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, signIn } from "@/lib/auth";
import { signupSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";

async function getRateLimitIdentifier() {
  const h = await headers();
  return h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "unknown";
}

export async function signupAction(formData: FormData) {
  const ip = await getRateLimitIdentifier();
  const rl = await rateLimit(`signup:${ip}`, { limit: 3, windowMs: 60000 });
  if (!rl.success) {
    return { error: { root: ["Too many attempts. Please try again later."] } };
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
    return { error: { email: ["Email already registered"] } };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await db.user.create({
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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: { root: ["Account created but login failed"] } };
    }
    throw error;
  }

  revalidatePath("/");
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
