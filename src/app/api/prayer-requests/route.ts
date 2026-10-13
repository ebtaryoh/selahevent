import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { prayerRequests } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const filter = searchParams.get("filter"); // "all" | "testimonies" | "requests"

    const conditions = [eq(prayerRequests.isApproved, true)];

    if (category && category !== "all") {
      conditions.push(eq(prayerRequests.category, category));
    }

    if (filter === "testimonies") {
      conditions.push(eq(prayerRequests.isTestimony, true));
    } else if (filter === "requests") {
      conditions.push(eq(prayerRequests.isTestimony, false));
    }

    const items = await db
      .select()
      .from(prayerRequests)
      .where(and(...conditions))
      .orderBy(desc(prayerRequests.createdAt))
      .limit(50);

    return NextResponse.json({ ok: true, prayers: items });
  } catch (error) {
    console.error("[selah-prayers] fetch error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch prayer wall." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const authorName = String(body.authorName || "").trim() || "Anonymous Believer";
    const authorCity = String(body.authorCity || "").trim() || "Lagos";
    const category = String(body.category || "general").toLowerCase();
    const isTestimony = Boolean(body.isTestimony);
    const testimonyUpdate = body.testimonyUpdate ? String(body.testimonyUpdate).trim() : null;

    if (!title || title.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Please enter a descriptive prayer title." },
        { status: 400 }
      );
    }

    if (!content || content.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Please share a few sentences so believers can join in prayer." },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(prayerRequests)
      .values({
        title,
        content,
        authorName,
        authorCity,
        category,
        isTestimony,
        testimonyUpdate,
        prayerCount: isTestimony ? 12 : 1,
        isApproved: true,
      })
      .returning();

    return NextResponse.json({ ok: true, prayer: created }, { status: 201 });
  } catch (error) {
    console.error("[selah-prayers] create error:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to post prayer request right now." },
      { status: 500 }
    );
  }
}
