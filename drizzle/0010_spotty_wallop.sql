ALTER TABLE "app_users" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "blueprints" ADD COLUMN "original_event_id" uuid;--> statement-breakpoint
ALTER TABLE "blueprints" ADD COLUMN "structure" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "scanned_by" uuid;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "certificate_threshold" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "payment_gateway" text DEFAULT 'paystack' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "payment_gateway_mode" text DEFAULT 'test' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "paystack_public_key" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "paystack_secret_key" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "retention_attendee_history_months" integer DEFAULT 24 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "retention_sensitive_data_days" integer DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "retention_auto_suggest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "retention_marketing_use" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "last_policy_review_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "otps" ADD COLUMN "attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "checkout_url" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD COLUMN "requires_approval" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "volunteers" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_original_event_id_events_id_fk" FOREIGN KEY ("original_event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_scanned_by_app_users_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."app_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_org_email_unique" UNIQUE("organization_id","email");--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_registration_unique" UNIQUE("registration_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_reference_unique" UNIQUE("gateway_reference");--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_idempotency_unique" UNIQUE("event_id","idempotency_key");