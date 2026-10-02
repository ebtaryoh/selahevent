CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" text PRIMARY KEY NOT NULL,
  "window_start" timestamp with time zone NOT NULL,
  "count" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "rate_limit_buckets_window_idx"
  ON "rate_limit_buckets" ("window_start");

-- Buckets are garbage-collected separately; active windows are sufficient for enforcement.
