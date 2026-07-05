"use server";

import { Resend } from "resend";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getContactMessagesAction() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  return db.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getContactMessageAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  await db.contactMessage.update({ where: { id }, data: { read: true } });

  return db.contactMessage.findUnique({ where: { id } });
}

export async function replyContactAction(
  messageId: string,
  replyBody: string
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  if (!replyBody.trim()) throw new Error("Reply body is required");

  const msg = await db.contactMessage.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error("Message not found");

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("Email service not configured");

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: `Sufyan from GoodieBox <admin@goodieboxstore.online>`,
    to: msg.email,
    replyTo: "admin@goodieboxstore.online",
    subject: `Re: ${msg.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <p style="color:#475569;line-height:1.6">Hi ${msg.name},</p>
        <div style="color:#475569;line-height:1.6;white-space:pre-wrap">${replyBody}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:13px;color:#94a3b8;margin:0">On ${msg.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}, you wrote:</p>
        <blockquote style="border-left:3px solid #e91e8c;margin:8px 0;padding:8px 16px;color:#64748b;font-size:13px;line-height:1.5;white-space:pre-wrap">${msg.message}</blockquote>
        <p style="font-size:13px;color:#94a3b8;margin-top:16px">— Sufyan<br/>GoodieBox Store</p>
      </div>
    `,
  });

  await db.contactMessage.update({
    where: { id: messageId },
    data: { repliedAt: new Date(), replyBody, read: true },
  });

  revalidatePath("/admin/contacts");
  return { success: true };
}
