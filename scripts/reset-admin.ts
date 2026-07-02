import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

async function main() {
  const email = "sufyan.at.work.with.web@gmail.com";
  const password = "SufyanAdmin1211";
  const hashed = await hash(password, 12);

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    await db.user.update({
      where: { email },
      data: { passwordHash: hashed, role: "ADMIN" },
    });
    console.log(`Updated ${email} → role=ADMIN, password updated`);
  } else {
    await db.user.create({
      data: {
        email,
        name: "Admin",
        passwordHash: hashed,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log(`Created admin user: ${email}`);
  }

  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
