import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { organizations, auditLogs } from "@/db/schema";
import { ilike } from "drizzle-orm";
import { createOrgSession } from "@/lib/session";
import { redirect } from "next/navigation";

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

  // Get the next URL and clear the cookie
  const nextUrl = cookieStore.get("google_oauth_next")?.value || "/dashboard";
  cookieStore.delete("google_oauth_next");

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

    const { email, name, picture } = await userResponse.json();

    if (!email) {
      return NextResponse.redirect(`${loginUrl}?error=No email provided by Google.`);
    }

    // Look up the organization by email
    const orgs = await db
      .select()
      .from(organizations)
      .where(ilike(organizations.email, email))
      .limit(1);

    let org;

    if (orgs.length === 0) {
      // Auto-provision a new workspace for the user
      const workspaceName = name ? `${name}'s Workspace` : "My Workspace";
      const baseSlug = workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const slug = `${baseSlug}-${Math.floor(Math.random() * 9000 + 1000)}`;

      const inserted = await db.insert(organizations).values({
        name: workspaceName,
        slug: slug,
        email: email,
        orgType: "ministry",
        logoUrl: picture,
      }).returning();
      
      org = inserted[0];

      // Audit log for creation
      await db.insert(auditLogs).values({
        organizationId: org.id,
        actor: email,
        action: "created_workspace_sso",
        entity: "organization",
        entityId: org.id,
        detail: "Auto-provisioned workspace via Google Auth",
      });
    } else {
      org = orgs[0];
      if (!org.logoUrl && picture) {
        const updated = await db
          .update(organizations)
          .set({ logoUrl: picture })
          .where(ilike(organizations.email, email))
          .returning();
        org = updated[0];
      }
    }

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

  } catch (err: any) {
    console.error("[oauth] Callback error:", err);
    return NextResponse.redirect(`${loginUrl}?error=Authentication encountered an unexpected error.`);
  }

  // Use next/navigation redirect to ensure cookies() mutation is safely flushed to the response
  redirect(nextUrl);
}
