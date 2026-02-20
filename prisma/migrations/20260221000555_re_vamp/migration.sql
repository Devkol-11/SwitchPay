/*
  Warnings:

  - You are about to drop the column `providerRef` on the `Payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "providerRef",
ALTER COLUMN "provider" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MerchantProvider" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "priority" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MerchantProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttempt" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchantProvider_merchantId_idx" ON "MerchantProvider"("merchantId");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProvider_merchantId_provider_key" ON "MerchantProvider"("merchantId", "provider");

-- CreateIndex
CREATE INDEX "PaymentAttempt_paymentId_idx" ON "PaymentAttempt"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentAttempt_provider_idx" ON "PaymentAttempt"("provider");

-- AddForeignKey
ALTER TABLE "MerchantProvider" ADD CONSTRAINT "MerchantProvider_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
