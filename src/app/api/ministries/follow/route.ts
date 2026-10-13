import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { ministryFollowers } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ministryId = String(body.ministryId || "").trim();
    const ministryName = String(body.ministryName || "").trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phone = body.phone ? String(body.phone).trim() : null;

    if (!ministryId || !ministryName) {
      return NextResponse.json(
        { ok: false, error: "Missing ministry information." },
        { status: 400 }
      );
    }

    // Check if this contact already follows this ministry
    if (email) {
      const existing = await db
        .select()
        .from(ministryFollowers)
        .where(
          and(
            eq(ministryFollowers.ministryId, ministryId),
            eq(ministryFollowers.email, email)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({
          ok: true,
          message: `You are already subscribed to ${ministryName}!`,
        });
      }
    }

    const [created] = await db
      .insert(ministryFollowers)
      .values({
        ministryId,
        ministryName,
        email,
        phone,
      })
      .returning();

    return NextResponse.json({
      ok: true,
      message: `Successfully connected with ${ministryName}!`,
      follower: created,
    });
  } catch (error) {
    console.error("[selah-follow] error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to connect with ministry." },
      { status: 500 }
    );
  }
}
