import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "selah_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production.");
    return new TextEncoder().encode("dev-only-insecure-secret-32-chars!!");
  }
  return new TextEncoder().encode(secret);
}

export async function proxy(request: Request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.headers.get("cookie")?.split(";").map(v => v.trim()).find(v => v.startsWith(COOKIE_NAME + "="))?.slice(COOKIE_NAME.length + 1);

  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.orgId || typeof payload.orgId !== "string") throw new Error("Invalid session");
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
