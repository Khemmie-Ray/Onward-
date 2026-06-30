import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/leaderboard"] as const;

const AUTH_API_PREFIX = "/api/auth";

const API_PREFIX = "/api";

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isOnboardingPath(pathname: string): boolean {
  return pathname.startsWith("/onboarding");
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith(AUTH_API_PREFIX)) return NextResponse.next();
  if (pathname.startsWith(API_PREFIX)) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token?.sub;
  const isPublic = isPublicPath(pathname);
  const isOnboarding = isOnboardingPath(pathname);

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isAuthenticated && isPublic) {
    return NextResponse.redirect(new URL("/overview", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|otf)).*)",
  ],
};