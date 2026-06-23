import "dotenv/config";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";

if (process.env.NODE_ENV === "production") {
  console.error("Seed script cannot run in production");
  process.exit(1);
}

async function main() {
  console.log("Seeding database...");

  const adminPassword = await hash("admin123", 12);
  const sellerPassword = await hash("sufyan1211", 12);
  const customerPassword = await hash("customer123", 12);

  const admin = await db.user.upsert({
    where: { email: "admin@goodiebox.com" },
    update: {},
    create: {
      email: "admin@goodiebox.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: { create: {} },
      cart: { create: {} },
    },
  });

  const seller = await db.user.upsert({
    where: { email: "sufyanbahauddin12@gmail.com" },
    update: {},
    create: {
      email: "sufyanbahauddin12@gmail.com",
      name: "Sufyan Bahauddin",
      passwordHash: sellerPassword,
      role: "SELLER",
      profile: {
        create: {
          brandName: "GoodieBox Official",
          bio: "Curated gift boxes for every occasion",
          rating: 4.8,
        },
      },
      cart: { create: {} },
    },
  });

  const customer = await db.user.upsert({
    where: { email: "customer@goodiebox.com" },
    update: {},
    create: {
      email: "customer@goodiebox.com",
      name: "Test Customer",
      passwordHash: customerPassword,
      role: "CUSTOMER",
      profile: { create: {} },
      cart: { create: {} },
    },
  });

  console.log("Seed completed!");
  console.log({ admin: admin.email, seller: seller.email, customer: customer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
