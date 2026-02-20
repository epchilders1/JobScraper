/*
  Warnings:

  - You are about to drop the column `label` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `defaultResumeId` on the `UserPreferences` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Resume` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "label";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resumeId" TEXT;

-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "defaultResumeId";

-- CreateIndex
CREATE UNIQUE INDEX "Resume_userId_key" ON "Resume"("userId");
