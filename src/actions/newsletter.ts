"use server";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { sendNewsletterConfirmation } from "@/lib/email";

export async function subscribeNewsletterAction(email: string) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Valid email is required" };
  }

  try {
    await db.newsletterSubscriber.create({ data: { email } });

    sendNewsletterConfirmation(email, email.split("@")[0]);

    return { success: true };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "You're already subscribed!" };
    }
    logger.error("Newsletter subscribe failed", error);
    return { error: "Something went wrong. Try again." };
  }
}
