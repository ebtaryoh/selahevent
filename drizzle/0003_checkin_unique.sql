CREATE UNIQUE INDEX IF NOT EXISTS "check_ins_registration_unique" ON "check_ins" USING btree ("registration_id");
