/*
  Warnings:

  - You are about to drop the `TargetTitle` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TargetTitle" DROP CONSTRAINT "TargetTitle_userId_fkey";

-- DropForeignKey
ALTER TABLE "TargetTitle" DROP CONSTRAINT "TargetTitle_userPreferencesId_fkey";

-- AlterTable
ALTER TABLE "UserPreferences" ADD COLUMN     "targetTitles" TEXT[];

-- DropTable
DROP TABLE "TargetTitle";
