import { db } from "@/lib/db";

async function main() {
  const email = "sufyanwebs@gmail.com";
  const user = await db.user.findUnique({
    where: { email },
    include: { authenticators: true, accounts: true, sessions: true },
  });
  if (!user) {
    console.log("User not found");
    return;
  }
  console.log("Found:", JSON.stringify({ id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, role: user.role, hasPassword: !!user.passwordHash, authenticators: user.authenticators.length, accounts: user.accounts.length, sessions: user.sessions.length }));

  // Clean up tokens and logs manually, then delete user (cascade handles the rest)
  await db.auditLog.deleteMany({ where: { entityId: user.id } });
  await db.verificationToken.deleteMany({ where: { identifier: user.id } });
  await db.user.delete({ where: { id: user.id } });
  console.log("Deleted");
}

main().catch(console.error);
