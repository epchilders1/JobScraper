import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "~/server/auth/config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/" || pathname.startsWith("/api/auth/")) return NextResponse.next();

  if (!req.auth && pathname === "/profile" || !req.auth && pathname==="/jobs") {
    return NextResponse.redirect(new URL("/api/auth/signin", req.url));
  }

  if (!req.auth?.user?.approved) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
