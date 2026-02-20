/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_createdById_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "rawText" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "skills" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCities" TEXT[],
    "maxCommuteRadius" INTEGER,
    "remoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "workStyle" TEXT,
    "targetTitles" TEXT[],
    "experienceLevel" TEXT[],
    "jobTypes" TEXT[],
    "minSalary" INTEGER,
    "minMatchScore" DOUBLE PRECISION,
    "defaultResumeId" TEXT,
    "requiredKeywords" TEXT[],
    "excludedKeywords" TEXT[],

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- AddForeignKey
ALTER TABLE "Resume" ADD CONSTRAINT "Resume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
