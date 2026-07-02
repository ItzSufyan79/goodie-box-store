import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const { hash } = bcrypt;

const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://neondb_owner:npg_TvlU0Wdsw1Oy@ep-bold-waterfall-ao3yysfi-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require" } },
});

async function main() {
  const email = "sufyan.at.work.with.web@gmail.com";
  const password = "SufyanAdmin1211";
  const hashed = await hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashed, role: "ADMIN" },
    });
    console.log(`Updated ${email} → role=ADMIN, password updated`);
  } else {
    await prisma.user.create({
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

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
