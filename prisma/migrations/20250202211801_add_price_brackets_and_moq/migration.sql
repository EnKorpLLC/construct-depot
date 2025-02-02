-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isSystemProduct" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minOrderQuantity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "PriceBracket" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceBracket_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PriceBracket" ADD CONSTRAINT "PriceBracket_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
