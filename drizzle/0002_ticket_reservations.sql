CREATE TABLE "ticket_reservations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_type_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "registration_id" uuid,
  "status" text DEFAULT 'reserved' NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket_reservations" ADD CONSTRAINT "ticket_reservations_ticket_type_id_ticket_types_id_fk" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_types"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ticket_reservations" ADD CONSTRAINT "ticket_reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "ticket_reservations_ticket_idx" ON "ticket_reservations" USING btree ("ticket_type_id");
--> statement-breakpoint
CREATE INDEX "ticket_reservations_event_idx" ON "ticket_reservations" USING btree ("event_id");
--> statement-breakpoint
CREATE INDEX "ticket_reservations_registration_idx" ON "ticket_reservations" USING btree ("registration_id");
--> statement-breakpoint
CREATE INDEX "ticket_reservations_active_idx" ON "ticket_reservations" USING btree ("ticket_type_id","status","expires_at");
