import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { env } from "~/env";

export const userRouter = createTRPCRouter({

  getJobMatches: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        starredOnly: z.boolean().optional(),
        minMatchScore: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { db: prisma, session } = ctx;
      const resume = await prisma.resume.findUnique({
        where: { userId: session.user.id },
      });
      if (!resume) return [];

      const now = new Date();
      const items = await prisma.jobMatch.findMany({
        where: {
          resumeId: resume.id,
          matchScore: { gte: input.minMatchScore ?? 0 },
          ...(input.starredOnly ? { star: true } : {}),
          job: {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            ...(input.search
              ? { title: { contains: input.search, mode: "insensitive" } }
              : {}),
          },
        },
        include: { job: true },
        orderBy: { matchScore: "desc" },
      });

      return items.map((m) => ({
        id: m.id,
        star: m.star,
        matchScore: m.matchScore,
        skillsMatched: m.skillsMatched,
        skillsGap: m.skillsGap,
        title: m.job.title,
        company: m.job.company,
        location: m.job.location,
        salaryMin: m.job.salaryMin,
        salaryMax: m.job.salaryMax,
        description: m.job.description,
        url: m.job.applyUrl,
      }));
    }),

  loadMoreJobs: protectedProcedure
    .input(z.object({ page: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { db: prisma, session } = ctx;
      const userId = session.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true, resume: true },
      });
      if (!user?.preferences) throw new Error("No preferences found");

      const prefs = user.preferences;
      const requestBody = {
        targetTitles: prefs.targetTitles,
        workStyle: prefs.workStyle,
        experienceLevel: prefs.experienceLevel,
        jobTypes: prefs.jobTypes,
        minSalary: prefs.minSalary,
        minMatchScore: prefs.minMatchScore,
        preferredCities: prefs.preferredCities,
        requiredKeywords: prefs.requiredKeywords,
        excludedKeywords: prefs.excludedKeywords,
        resumeEmbedding: user.resume?.embedding,
        page: input.page,
      };

      const res = await fetch(`${env.FLASK_API_URL}/get_jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const jobs = (await res.json()) as { id: string; matchScore: number }[];
      if (!Array.isArray(jobs) || jobs.length === 0) return { count: 0 };

      const resume = await prisma.resume.findUnique({ where: { userId } });
      if (!resume) return { count: 0 };

      let count = 0;
      for (const item of jobs) {
        const job = await prisma.job.findUnique({ where: { externalId: item.id } });
        if (!job) continue;
        await prisma.jobMatch.upsert({
          where: { jobId_resumeId: { jobId: job.id, resumeId: resume.id } },
          create: {
            jobId: job.id,
            resumeId: resume.id,
            matchScore: item.matchScore / 100,
            skillsMatched: [],
            skillsGap: [],
          },
          update: { matchScore: item.matchScore / 100 },
        });
        count++;
      }
      return { count };
    }),

  saveJobMatches: protectedProcedure
    .input(
      z.array(
        z.object({
          externalId: z.string(),
          matchScore: z.number(), // 0–100 from Flask
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const { db: prisma, session } = ctx;
      const resume = await prisma.resume.findUnique({
        where: { userId: session.user.id },
      });
      if (!resume) throw new Error("No resume found for user");

      for (const item of input) {
        const job = await prisma.job.findUnique({
          where: { externalId: item.externalId },
        });
        if (!job) continue;

        await prisma.jobMatch.upsert({
          where: { jobId_resumeId: { jobId: job.id, resumeId: resume.id } },
          create: {
            jobId: job.id,
            resumeId: resume.id,
            matchScore: item.matchScore / 100,
            skillsMatched: [],
            skillsGap: [],
          },
          update: {
            matchScore: item.matchScore / 100,
          },
        });
      }
    }),

  toggleStar: protectedProcedure
    .input(
      z.object({
        jobMatchId: z.string(),
        star: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { db: prisma, session } = ctx;
      const match = await prisma.jobMatch.findFirst({
        where: { id: input.jobMatchId, resume: { userId: session.user.id } },
      });
      if (!match) throw new Error("Job match not found");
      return prisma.jobMatch.update({
        where: { id: input.jobMatchId },
        data: { star: input.star },
      });
    }),

  getProfile: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async({ input,ctx }) => {
      const { db: prisma } = ctx;
      return await prisma.user.findFirst({
        where:{
          id: input.id
        },
        include:{
          preferences: true,
          resume: true,
        }
      })
    }),
  upsertUserPreferences: protectedProcedure
    .input(
      z.object({
        targetTitles: z.array(z.string()),
        workStyle: z.string().nullable(),
        experienceLevel: z.array(z.string()),
        jobTypes: z.array(z.string()),
        minSalary: z.number().nullable(),
        minMatchScore: z.number().nullable(),
        preferredCities: z.array(z.string()),
        requiredKeywords: z.array(z.string()),
        excludedKeywords: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { db: prisma, session } = ctx;
      const userId = session.user?.id;
      if (!userId) throw new Error("Not authenticated");

      // Clear all job matches so they get re-scored against updated preferences
      const resume = await prisma.resume.findUnique({ where: { userId } });
      if (resume) {
        await prisma.jobMatch.deleteMany({ where: { resumeId: resume.id, star: false } });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          preferences: {
            upsert: {
              create: input,
              update: input,
            },
          },
        },
      });
    }),

  upsertResume: protectedProcedure
    .input(
      z.object({
        rawText: z.string(),
        skills: z.array(z.string()),
        embedding: z.array(z.number()),
        fileName: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { db: prisma, session } = ctx;
      const userId = session.user?.id;
      if (!userId) throw new Error("Not authenticated");

      await prisma.resume.upsert({
        where: { userId },
        create: { userId, ...input },
        update: input,
      });
    }),
});
