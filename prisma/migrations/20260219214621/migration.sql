/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `Resume` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `maxCommuteRadius` on the `UserPreferences` table. All the data in the column will be lost.
  - Added the required column `fileName` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "fileUrl",
DROP COLUMN "isDefault",
ADD COLUMN     "fileName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "image";

-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "maxCommuteRadius";
