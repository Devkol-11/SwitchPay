/*
  Warnings:

  - The values [SUCCESS] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `apiKey` on the `Merchant` table. All the data in the column will be lost.
  - You are about to drop the column `webHookSecret` on the `Merchant` table. All the data in the column will be lost.
  - You are about to drop the column `providerReference` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[apiKeyHash]` on the table `Merchant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[merchantId,idempotencyKey]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `apiKeyHash` to the `Merchant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'PAYSTACK');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED');
ALTER TABLE "public"."Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_merchantId_fkey";

-- DropIndex
DROP INDEX "Merchant_apiKey_key";

-- DropIndex
DROP INDEX "Payment_idempotencyKey_key";

-- AlterTable
ALTER TABLE "Merchant" DROP COLUMN "apiKey",
DROP COLUMN "webHookSecret",
ADD COLUMN     "apiKeyHash" TEXT NOT NULL,
ADD COLUMN     "webhookSecret" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "providerReference",
ADD COLUMN     "provider" "PaymentProvider" NOT NULL,
ADD COLUMN     "providerRef" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Merchant_apiKeyHash_key" ON "Merchant"("apiKeyHash");

-- CreateIndex
CREATE INDEX "Merchant_name_idx" ON "Merchant"("name");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantId_idempotencyKey_key" ON "Payment"("merchantId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
