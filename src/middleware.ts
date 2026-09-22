import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "selah_session";

// Routes that don't require a session
const PUBLIC_PREFIXES = ["/", "/e/", "/login", "/register", "/verify/", "/api/", "/_next/", "/images/", "/uploads/", "/favicon"];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix)
  );
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return new TextEncoder().encode("dev-only-insecure-secret-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      await jwtVerify(token, getSecret());
      return NextResponse.next();
    } catch {
      // Token is expired, tampered, or invalid
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clear the bad cookie
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Redirect signed-in users away from auth pages
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      try {
        await jwtVerify(token, getSecret());
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Token is invalid, let them see the auth page
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
