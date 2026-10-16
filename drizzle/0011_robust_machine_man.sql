CREATE TABLE "event_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'NGN' NOT NULL,
	"type" text DEFAULT 'physical' NOT NULL,
	"category" text DEFAULT 'Merchandise' NOT NULL,
	"image_url" text,
	"stock_quantity" integer DEFAULT -1 NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"download_url" text,
	"variants" jsonb DEFAULT '[]'::jsonb,
	"requires_pickup" boolean DEFAULT true NOT NULL,
	"allow_addon_at_checkout" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ministry_followers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ministry_id" text NOT NULL,
	"ministry_name" text NOT NULL,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"product_id" uuid,
	"registration_id" uuid,
	"payment_id" uuid,
	"order_code" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text DEFAULT '' NOT NULL,
	"product_name" text NOT NULL,
	"product_type" text DEFAULT 'physical' NOT NULL,
	"variant" text,
	"unit_price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total_price" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"fulfillment_status" text DEFAULT 'unfulfilled' NOT NULL,
	"pickup_voucher_code" text NOT NULL,
	"collected_at" timestamp with time zone,
	"collected_by_staff_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_pickup_voucher_code_unique" UNIQUE("pickup_voucher_code")
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text DEFAULT 'Anonymous Believer' NOT NULL,
	"author_city" text DEFAULT 'Lagos' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"prayer_count" integer DEFAULT 1 NOT NULL,
	"is_testimony" boolean DEFAULT false NOT NULL,
	"testimony_update" text,
	"is_approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "has_waitlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "attendee_types" jsonb DEFAULT '["Delegate","Student","Minister / clergy","Volunteer","Speaker","Guest"]'::jsonb;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "accommodation_mode" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "collect_gender" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "collect_age_bracket" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "collect_occupation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "meta_pixel_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "google_analytics_id" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "age_bracket" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "occupation" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "table_number" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "seat_number" text;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "accommodation_type" text;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD COLUMN "has_waitlist" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD COLUMN "is_donation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_types" ADD COLUMN "pass_fee_to_attendee" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_products" ADD CONSTRAINT "event_products_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_event_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."event_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_products_event_idx" ON "event_products" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ministry_followers_min_idx" ON "ministry_followers" USING btree ("ministry_id");--> statement-breakpoint
CREATE INDEX "ministry_followers_email_idx" ON "ministry_followers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "order_items_event_idx" ON "order_items" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "order_items_registration_idx" ON "order_items" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "order_items_payment_idx" ON "order_items" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "order_items_voucher_idx" ON "order_items" USING btree ("pickup_voucher_code");--> statement-breakpoint
CREATE INDEX "prayer_requests_created_idx" ON "prayer_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prayer_requests_cat_idx" ON "prayer_requests" USING btree ("category");