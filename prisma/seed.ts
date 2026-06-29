import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

if (process.env.NODE_ENV === "production") {
  console.error("Seed script cannot run in production");
  process.exit(1);
}

const defaultHero = {
  badge: "Curated with love for every occasion",
  heading: "Gift Boxes That Make Memories",
  headingHighlight: "Make Memories",
  subtitle:
    "From exam survival kits to birthday surprises — discover thoughtfully curated goodie boxes, college essentials, and snacks delivered to your doorstep.",
  image:
    "https://images.unsplash.com/photo-1549465220-1a0b9238e821?w=800&q=80",
  statNumber: "50+",
  statLabel: "Gift Collections",
};

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

  await db.siteSetting.upsert({
    where: { key: "homepage_hero" },
    update: { value: defaultHero },
    create: { key: "homepage_hero", value: defaultHero },
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
