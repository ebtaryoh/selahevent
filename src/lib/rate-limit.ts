import { createHash } from "crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";

const DEFAULT_WINDOW_SECONDS = 60;

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp?.trim() || "unknown";
  return ip.slice(0, 128);
}

export async function enforceRateLimit(
  namespace: string,
  identifier: string,
  limit: number,
  windowSeconds = DEFAULT_WINDOW_SECONDS,
) {
  const key = hashKey(namespace + ":" + identifier);

  const result = await db.execute(sql\`
    INSERT INTO rate_limit_buckets (key, window_start, count)
    VALUES (\${key}, NOW(), 1)
    ON CONFLICT (key) DO UPDATE
    SET
      window_start = CASE
        WHEN rate_limit_buckets.window_start <= NOW() - make_interval(secs => \${windowSeconds})
          THEN NOW()
        ELSE rate_limit_buckets.window_start
      END,
      count = CASE
        WHEN rate_limit_buckets.window_start <= NOW() - make_interval(secs => \${windowSeconds})
          THEN 1
        ELSE rate_limit_buckets.count + 1
      END
    RETURNING count, window_start
  \`);

  const row = result.rows[0] as { count: number | string; window_start: Date | string };
  const count = Number(row.count);
  const windowStart = new Date(row.window_start).getTime();
  const retryAfter = Math.max(
    1,
    Math.ceil((windowStart + windowSeconds * 1000 - Date.now()) / 1000),
  );

  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfter,
  };
}

export function rateLimitHeaders(result: Awaited<ReturnType<typeof enforceRateLimit>>) {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "Retry-After": String(result.retryAfter),
  };
}
