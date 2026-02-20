import NextAuth from "next-auth";
import { cache } from "react";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "./config";
import { db } from "~/server/db";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
});

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
