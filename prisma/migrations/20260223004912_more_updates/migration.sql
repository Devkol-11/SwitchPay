/*
  Warnings:

  - Added the required column `encryptedApiKey` to the `MerchantProvider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cardBin` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cardCountry` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'FLUTTERWAVE';

-- AlterTable
ALTER TABLE "MerchantProvider" ADD COLUMN     "encryptedApiKey" TEXT NOT NULL,
ADD COLUMN     "encryptedPublicKey" TEXT,
ADD COLUMN     "feeStructure" JSONB;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cardBin" TEXT NOT NULL,
ADD COLUMN     "cardCountry" TEXT NOT NULL;
