/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `ApiKey` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApiMode" AS ENUM ('TEST', 'LIVE');

-- DropIndex
DROP INDEX "ApiKey_merchantId_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "expiresAt",
ADD COLUMN     "mode" "ApiMode" NOT NULL DEFAULT 'TEST';

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
