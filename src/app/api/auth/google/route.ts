import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID is not configured." },
      { status: 500 }
    );
  }

  // Determine the callback URL based on the incoming request to support both local and prod
  const url = new URL(req.url);
  const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;

  // Generate a random state string for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Store the state in a cookie to verify it when Google redirects back
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
