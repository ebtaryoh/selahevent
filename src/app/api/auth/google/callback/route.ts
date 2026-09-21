import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { organizations, auditLogs } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { createOrgSession } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;
  const loginUrl = `${url.protocol}//${url.host}/login`;

  if (error || !code) {
    return NextResponse.redirect(`${loginUrl}?error=Access denied by Google.`);
  }

  // Verify state token to prevent CSRF
  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${loginUrl}?error=Invalid authentication state. Please try again.`);
  }

  // Clear the state cookie
  cookieStore.delete("google_oauth_state");

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("[oauth] Google token error:", err);
      return NextResponse.redirect(`${loginUrl}?error=Failed to fetch Google token.`);
    }

    const { access_token } = await tokenResponse.json();

    // Fetch the user's email from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(`${loginUrl}?error=Failed to fetch Google user info.`);
    }

    const { email } = await userResponse.json();

    if (!email) {
      return NextResponse.redirect(`${loginUrl}?error=No email provided by Google.`);
    }

    // Look up the organization by email
    const orgs = await db
      .select()
      .from(organizations)
      .where(ilike(organizations.email, email))
      .limit(1);

    if (orgs.length === 0) {
      // If we wanted to allow signups, we could insert a new organization here.
      // But based on the existing flow, the workspace must exist (or be created via a separate flow).
      return NextResponse.redirect(`${loginUrl}?error=Workspace not found for ${email}. Contact support if this is a mistake.`);
    }

    const org = orgs[0];

    // Create session
    await createOrgSession(org.id);

    // Audit log
    await db.insert(auditLogs).values({
      organizationId: org.id,
      actor: email,
      action: "logged_in_sso",
      entity: "organization",
      entityId: org.id,
      detail: "Logged in via Google Authentication",
    });

    return NextResponse.redirect(`${url.protocol}//${url.host}/dashboard`);
  } catch (err: any) {
    console.error("[oauth] Callback error:", err);
    return NextResponse.redirect(`${loginUrl}?error=Authentication encountered an unexpected error.`);
  }
}
