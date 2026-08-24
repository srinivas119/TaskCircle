/*
  Warnings:

  - You are about to drop the column `phone` on the `OTPVerification` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationExpires` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - Added the required column `email` to the `OTPVerification` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OTPVerification_phone_createdAt_idx";

-- DropIndex
DROP INDEX "User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "OTPVerification" DROP COLUMN "phone",
ADD COLUMN     "email" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationExpires",
DROP COLUMN "emailVerificationToken";

-- CreateIndex
CREATE INDEX "OTPVerification_email_createdAt_idx" ON "OTPVerification"("email", "createdAt");
