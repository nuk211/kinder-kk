/*
  Warnings:

  - Added the required column `registrationType` to the `Installment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'TEACHER';
ALTER TYPE "Role" ADD VALUE 'MISS';

-- DropIndex
DROP INDEX "Child_qrCode_key";

-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "isRegistered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "registrationType" "RegistrationType" NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paymentDate" SET DEFAULT CURRENT_TIMESTAMP;
