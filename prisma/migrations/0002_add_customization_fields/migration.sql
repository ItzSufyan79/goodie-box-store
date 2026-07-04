-- Add customizations to CartItem and OrderItem
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "customizations" JSONB;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "customizations" JSONB;

-- Drop the unique constraint on CartItem (same product can be added with different customizations)
DROP INDEX IF EXISTS "CartItem_cartId_productId_key";

-- Create CustomProductField table
CREATE TABLE IF NOT EXISTS "CustomProductField" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomProductField_pkey" PRIMARY KEY ("id")
);

-- Add foreign key and indexes
ALTER TABLE "CustomProductField" ADD CONSTRAINT "CustomProductField_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "CustomProductField_productId_idx" ON "CustomProductField"("productId");
