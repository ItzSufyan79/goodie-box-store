-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DELAYED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "delayReason" TEXT;
ALTER TABLE "Order" ADD COLUMN "delayedAt" TIMESTAMP(3);
