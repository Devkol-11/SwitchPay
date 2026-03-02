/*
  Warnings:

  - Added the required column `used` to the `PasswordResetToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "used" BOOLEAN NOT NULL;
