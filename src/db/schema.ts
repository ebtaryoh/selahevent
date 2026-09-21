import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").defaultRandom().primaryKey();
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/* ------------------------------------------------------------------ */
/* Tenancy                                                             */
/* ------------------------------------------------------------------ */

export const organizations = pgTable("organizations", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  orgType: text("org_type").default("church").notNull(),
  country: text("country").default("NG").notNull(),
  currency: text("currency").default("NGN").notNull(),
  timezone: text("timezone").default("Africa/Lagos").notNull(),
  email: text("email"),
  phone: text("phone"),
  website: text("website"),
  primaryColor: text("primary_color").default("#0e2a22").notNull(),
  accentColor: text("accent_color").default("#c08a2e").notNull(),
  plan: text("plan").default("growth").notNull(),
  eventCadence: text("event_cadence").default("monthly").notNull(),
  createdAt: createdAt(),
});

export const appUsers = pgTable(
  "app_users",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").default("viewer").notNull(),
    initials: text("initials").default("—").notNull(),
    status: text("status").default("active").notNull(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("app_users_org_idx").on(t.organizationId)]
);

/* ------------------------------------------------------------------ */
/* Events                                                              */
/* ------------------------------------------------------------------ */

export const events = pgTable(
  "events",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    theme: text("theme"),
    tagline: text("tagline"),
    description: text("description").default("").notNull(),
    eventType: text("event_type").default("conference").notNull(),
    status: text("status").default("draft").notNull(),
    visibility: text("visibility").default("public").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    timezone: text("timezone").default("Africa/Lagos").notNull(),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    city: text("city").notNull(),
    country: text("country").default("NG").notNull(),
    mode: text("mode").default("in_person").notNull(),
    capacity: integer("capacity").default(500).notNull(),
    coverImage: text("cover_image"),
    media: jsonb("media").$type<{ type: "image" | "video", url: string }[]>().default([]),
    currency: text("currency").default("NGN").notNull(),
    registrationOpensAt: timestamp("registration_opens_at", {
      withTimezone: true,
    }),
    registrationClosesAt: timestamp("registration_closes_at", {
      withTimezone: true,
    }),
    readiness: integer("readiness").default(0).notNull(),
    commsPlan: jsonb("comms_plan").$type<
      {
        offset: string;
        label: string;
        channel: string;
        status: "scheduled" | "sent" | "draft";
      }[]
    >(),
    blueprintId: uuid("blueprint_id"),
    customQuestions: jsonb("custom_questions").$type<{
      id: string;
      label: string;
      type: "text" | "select";
      options?: string[];
      required: boolean;
    }[]>().default([]),
    brandColor: text("brand_color").default("#c08a2e").notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("events_org_idx").on(t.organizationId),
    index("events_status_idx").on(t.status),
  ]
);

export const ticketTypes = pgTable(
  "ticket_types",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    price: integer("price").default(0).notNull(),
    currency: text("currency").default("NGN").notNull(),
    capacity: integer("capacity").default(100).notNull(),
    sold: integer("sold").default(0).notNull(),
    benefits: jsonb("benefits").$type<string[]>(),
    badge: text("badge"),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    isVisible: boolean("is_visible").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("ticket_types_event_idx").on(t.eventId)]
);

export const speakers = pgTable(
  "speakers",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    role: text("role").default("").notNull(),
    organization: text("organization").default("").notNull(),
    bio: text("bio").default("").notNull(),
    topic: text("topic").default("").notNull(),
    imageUrl: text("image_url"),
    accentHue: text("accent_hue").default("#c08a2e").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("speakers_event_idx").on(t.eventId)]
);

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    track: text("track").default("Main").notNull(),
    day: integer("day").default(1).notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    venue: text("venue").default("Main Hall").notNull(),
    speakerName: text("speaker_name"),
    kind: text("kind").default("session").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_event_idx").on(t.eventId)]
);

/* ------------------------------------------------------------------ */
/* Registration & payments                                             */
/* ------------------------------------------------------------------ */

export const attendees = pgTable(
  "attendees",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone").default("").notNull(),
    city: text("city").default("").notNull(),
    country: text("country").default("NG").notNull(),
    church: text("church").default("").notNull(),
    dietary: text("dietary").default("").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("attendees_org_idx").on(t.organizationId),
    index("attendees_email_idx").on(t.email),
    unique("org_email_unique").on(t.organizationId, t.email),
  ]
);

export const otps = pgTable(
  "otps",
  {
    id: id(),
    email: text("email").notNull(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("otps_email_idx").on(t.email),
  ]
);

/* ------------------------------------------------------------------ */

export const registrations = pgTable(
  "registrations",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    attendeeId: uuid("attendee_id").references(() => attendees.id, {
      onDelete: "set null",
    }),
    ticketTypeId: uuid("ticket_type_id").references(() => ticketTypes.id, {
      onDelete: "set null",
    }),
    code: text("code").notNull().unique(),
    ticketCode: text("ticket_code").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").default("").notNull(),
    city: text("city").default("").notNull(),
    country: text("country").default("NG").notNull(),
    church: text("church").default("").notNull(),
    attendeeType: text("attendee_type").default("delegate").notNull(),
    status: text("status").default("confirmed").notNull(),
    accommodation: boolean("accommodation").default(false).notNull(),
    transport: boolean("transport").default(false).notNull(),
    dietary: text("dietary").default("").notNull(),
    emergencyName: text("emergency_name").default("").notNull(),
    emergencyPhone: text("emergency_phone").default("").notNull(),
    amount: integer("amount").default(0).notNull(),
    source: text("source").default("event_page").notNull(),
    customAnswers: jsonb("custom_answers").$type<Record<string, string>>().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index("registrations_event_idx").on(t.eventId),
    index("registrations_email_idx").on(t.email),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    registrationId: uuid("registration_id").references(() => registrations.id, {
      onDelete: "set null",
    }),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    amount: integer("amount").notNull(),
    currency: text("currency").default("NGN").notNull(),
    gateway: text("gateway").default("paystack").notNull(),
    gatewayReference: text("gateway_reference").default("").notNull(),
    status: text("status").default("pending").notNull(),
    verified: boolean("verified").default(false).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("payments_event_idx").on(t.eventId)]
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    scannedBy: uuid("scanned_by").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    method: text("method").default("qr").notNull(),
    staffName: text("staff_name").default("Command Center").notNull(),
    gate: text("gate").default("Main entrance").notNull(),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("check_ins_event_idx").on(t.eventId),
    index("check_ins_registration_idx").on(t.registrationId),
  ]
);

export const certificates = pgTable(
  "certificates",
  {
    id: id(),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    verificationCode: text("verification_code").notNull().unique(),
    status: text("status").default("issued").notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("certificates_event_idx").on(t.eventId)]
);

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export const volunteers = pgTable(
  "volunteers",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    department: text("department").notNull(),
    role: text("role").default("Member").notNull(),
    shift: text("shift").default("").notNull(),
    phone: text("phone").default("").notNull(),
    status: text("status").default("confirmed").notNull(),
    isLeader: boolean("is_leader").default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("volunteers_event_idx").on(t.eventId)]
);

export const tasks = pgTable(
  "tasks",
  {
    id: id(),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "cascade",
    }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    category: text("category").default("General").notNull(),
    status: text("status").default("not_started").notNull(),
    priority: text("priority").default("normal").notNull(),
    assignee: text("assignee").default("").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("tasks_org_idx").on(t.organizationId)]
);

export const blueprints = pgTable(
  "blueprints",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    originalEventId: uuid("original_event_id").references(() => events.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    category: text("category").default("Conference").notNull(),
    includes: jsonb("includes").$type<string[]>(),
    structure: jsonb("structure").notNull().default({}),
    useCount: integer("use_count").default(0).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("blueprints_org_idx").on(t.organizationId)]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").default("").notNull(),
    entityId: text("entity_id").default("").notNull(),
    detail: text("detail").default("").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_org_idx").on(t.organizationId)]
);
