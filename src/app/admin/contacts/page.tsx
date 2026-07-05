import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getContactMessagesAction } from "@/actions/contact-message";
import { AdminContactClient } from "./admin-contact-client";

export default async function AdminContactsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/");

  const messages = await getContactMessagesAction();

  const serialized = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    repliedAt: m.repliedAt?.toISOString() ?? null,
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
      <p className="text-muted-foreground mb-8">View and reply to contact form submissions</p>
      <AdminContactClient messages={serialized} />
    </div>
  );
}
