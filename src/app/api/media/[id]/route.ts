import { db } from "@/db";
import { mediaUploads } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return new Response("Missing media id", { status: 400 });
  }

  try {
    const media = await db
      .select({
        mimeType: mediaUploads.mimeType,
        data: mediaUploads.data,
      })
      .from(mediaUploads)
      .where(eq(mediaUploads.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!media) {
      return new Response("Media not found", { status: 404 });
    }

    const buffer = Buffer.from(media.data, "base64");
    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": media.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving media:", error);
    return new Response("Error retrieving media", { status: 500 });
  }
}
