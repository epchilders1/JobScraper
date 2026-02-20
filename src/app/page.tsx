import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import LandingPage from "./pages/LandingPage/LandingPage";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
          <LandingPage/>
            {/* <Link
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              {session ? "Sign out" : "Sign in"}
            </Link> */}
    </HydrateClient>
  );
}
