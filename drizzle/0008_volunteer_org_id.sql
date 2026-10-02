ALTER TABLE "volunteers" ADD COLUMN IF NOT EXISTS "organization_id" uuid;

UPDATE "volunteers" v
SET "organization_id" = e."organization_id"
FROM "events" e
WHERE v."event_id" = e."id"
  AND v."organization_id" IS NULL;

ALTER TABLE "volunteers"
  ALTER COLUMN "organization_id" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'volunteers_organization_id_fkey'
  ) THEN
    ALTER TABLE "volunteers"
      ADD CONSTRAINT "volunteers_organization_id_fkey"
      FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "volunteers_org_idx" ON "volunteers" ("organization_id");
