-- Add isCustomizable column to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isCustomizable" BOOLEAN NOT NULL DEFAULT false;
