import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUsersAction } from "@/actions/admin-users";
import { AdminUsersClient } from "./admin-users-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management | Admin",
  description: "Manage user accounts and roles.",
};

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const users = await getUsersAction();

  const serialized = users.map((u) => ({
    ...u,
    emailVerified: u.emailVerified?.toISOString() ?? null,
    lockoutUntil: u.lockoutUntil?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminUsersClient users={serialized} />;
}
