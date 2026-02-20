/*
  Warnings:

  - You are about to drop the column `targetTitles` on the `UserPreferences` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserPreferences" DROP COLUMN "targetTitles";

-- CreateTable
CREATE TABLE "TargetTitle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "userId" TEXT NOT NULL,
    "userPreferencesId" TEXT,

    CONSTRAINT "TargetTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" TEXT,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "salary" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "jobType" TEXT,
    "remoteFlag" BOOLEAN,
    "applyUrl" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "embedding" DOUBLE PRECISION[],
    "normalizedTitle" TEXT,
    "extractedSkills" TEXT[],
    "source" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "matchScore" DOUBLE PRECISION NOT NULL,
    "skillsMatched" TEXT[],
    "skillsGap" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Job_externalId_key" ON "Job"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "JobMatch_jobId_resumeId_key" ON "JobMatch"("jobId", "resumeId");

-- AddForeignKey
ALTER TABLE "TargetTitle" ADD CONSTRAINT "TargetTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetTitle" ADD CONSTRAINT "TargetTitle_userPreferencesId_fkey" FOREIGN KEY ("userPreferencesId") REFERENCES "UserPreferences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobMatch" ADD CONSTRAINT "JobMatch_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
