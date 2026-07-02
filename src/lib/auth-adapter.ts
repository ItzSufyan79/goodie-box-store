import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const adapter = PrismaAdapter(db);
