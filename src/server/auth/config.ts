import { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      approved: boolean;
    } & DefaultSession["user"];
  }
}

// Edge-safe config — no Prisma imports.
// The adapter lives in index.ts so it only runs in Node.js contexts.
export const authConfig = {
  providers: [GoogleProvider],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token["id"] = user.id;
        token["approved"] = (user as { approved?: boolean }).approved ?? false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token["id"] as string;
      session.user.approved = (token["approved"] as boolean) ?? false;
      return session;
    },
  },
} satisfies NextAuthConfig;
