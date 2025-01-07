/*
  Warnings:

  - Made the column `status` on table `attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `attendance` MODIFY `status` ENUM('PRESENT', 'ABSENT', 'PICKED_UP') NOT NULL;
