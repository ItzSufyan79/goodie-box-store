"use server";

import { Resend } from "resend";
import { logger } from "@/lib/logger";

export async function contactAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !subject || !message) {
    return { error: "All fields are required" };
  }

  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) return { error: "Email service not configured" };

    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "orders@goodieboxstore.online";

    await resend.emails.send({
      from: `Goodie Box <${fromEmail}>`,
      to: process.env.CONTACT_EMAIL ?? "admin@goodieboxstore.online",
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#e91e8c">New Contact Form Submission</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px;font-weight:bold;color:#666">Name</td><td style="padding:8px">${name}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#666">Email</td><td style="padding:8px">${email}</td></tr>
            <tr><td style="padding:8px;font-weight:bold;color:#666">Subject</td><td style="padding:8px">${subject}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f5f5f5;border-radius:8px">
            <p style="margin:0;white-space:pre-wrap">${message}</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to send contact email", error, { email });
    return { error: "Failed to send message. Please try again later." };
  }
}
