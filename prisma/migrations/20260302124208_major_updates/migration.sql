/*
  Warnings:

  - Added the required column `keyPreview` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CARD', 'BANK_TRANSFER', 'USSD', 'MOBILE_MONEY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentProvider" ADD VALUE 'INTERSWITCH';
ALTER TYPE "PaymentProvider" ADD VALUE 'MONNIFY';
ALTER TYPE "PaymentProvider" ADD VALUE 'KORA';
ALTER TYPE "PaymentProvider" ADD VALUE 'REMITA';

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REVERSED';

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "keyPreview" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MerchantProvider" ALTER COLUMN "priority" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "bankCode" TEXT,
ADD COLUMN     "channel" "PaymentChannel" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "telcoNetwork" TEXT,
ALTER COLUMN "currency" SET DEFAULT 'NGN',
ALTER COLUMN "cardBin" DROP NOT NULL,
ALTER COLUMN "cardCountry" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PaymentAttempt" ADD COLUMN     "latencyMs" INTEGER;

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "merchantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "baseWeight" INTEGER NOT NULL DEFAULT 100,
    "isDown" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalProviderConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "GlobalProviderConfig_provider_key" ON "GlobalProviderConfig"("provider");

-- CreateIndex
CREATE INDEX "Payment_bankCode_idx" ON "Payment"("bankCode");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
