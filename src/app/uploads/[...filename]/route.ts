import { db } from "@/db";
import { mediaUploads } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string[] }> }
) {
  const resolvedParams = await params;
  const filename = Array.isArray(resolvedParams.filename)
    ? resolvedParams.filename.join("/")
    : String(resolvedParams.filename || "");

  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  // 1. Try local disk (works in local development if file exists in public/uploads)
  try {
    const localPath = path.join(process.cwd(), "public", "uploads", filename);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      const ext = path.extname(filename).toLowerCase().replace(".", "");
      const mime =
        ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : ext === "gif"
          ? "image/gif"
          : ext === "svg"
          ? "image/svg+xml"
          : "image/jpeg";
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch {
    // Disk read failed or running serverless
  }

  // 2. Query database mediaUploads table by filename or ID
  try {
    const record = await db.query.mediaUploads.findFirst({
      where: or(
        eq(mediaUploads.filename, filename),
        eq(mediaUploads.id, filename)
      ),
      columns: {
        data: true,
        mimeType: true,
      },
    });

    if (record && record.data) {
      const buffer = Buffer.from(record.data, "base64");
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type": record.mimeType || "image/jpeg",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (dbErr) {
    console.error("Failed to query mediaUploads for legacy upload:", dbErr);
  }

  // 3. Fallback: Return a clean neutral placeholder SVG instead of 404 so Next.js Image optimizer doesn't crash with 400
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" fill="none">
    <rect width="800" height="450" fill="#0E2A22"/>
    <circle cx="400" cy="210" r="48" fill="#E2C073" fill-opacity="0.15"/>
    <path d="M400 185v50M375 210h50" stroke="#E2C073" stroke-width="4" stroke-linecap="round"/>
    <text x="400" y="295" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#E2C073" text-anchor="middle" letter-spacing="1">SELAH SANCTUARY</text>
  </svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
