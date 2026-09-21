import { getOrgSession } from "./session";
import { redirect } from "next/navigation";
import { and, asc, count, desc, eq, sql, sum, or, ilike } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  blueprints,
  certificates,
  checkIns,
  events,
  organizations,
  payments,
  registrations,
  sessions,
  speakers,
  tasks,
  ticketTypes,
  volunteers,
} from "@/db/schema";
import { ensureSeed } from "@/lib/seed";

export async function getOrganization() {
  await ensureSeed();

  const session = await getOrgSession();
  if (!session) return null;

  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.orgId))
    .limit(1)
    .then((r) => r[0] ?? null);

  return org;
}

export async function getEventsForOrganization(orgId: string) {
  await ensureSeed();
  return db
    .select()
    .from(events)
    .where(eq(events.organizationId, orgId))
    .orderBy(asc(events.startsAt));
}

export async function getEventBySlug(slug: string) {
  await ensureSeed();
  return db
    .select()
    .from(events)
    .where(eq(events.slug, slug))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function getEventById(id: string) {
  if (!id || id === "undefined") return null;
  await ensureSeed();
  return db
    .select()
    .from(events)
    .where(eq(events.id, id))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function getTickets(eventId: string) {
  await ensureSeed();
  return db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, eventId))
    .orderBy(asc(ticketTypes.sortOrder));
}

export async function getOrganizationMemoryStats(orgId: string) {
  await ensureSeed();

  const [blueprintAgg] = await db
    .select({ total: count() })
    .from(blueprints)
    .where(eq(blueprints.organizationId, orgId));

  const [speakerAgg] = await db
    .select({ total: count() })
    .from(speakers)
    .where(eq(speakers.organizationId, orgId));

  const allVols = await db
    .select({ department: volunteers.department })
    .from(volunteers)
    .innerJoin(events, eq(volunteers.eventId, events.id))
    .where(eq(events.organizationId, orgId));
    
  const uniqueDepartments = new Set(allVols.map((v) => v.department));

  const allEvents = await db
    .select({ commsPlan: events.commsPlan })
    .from(events)
    .where(eq(events.organizationId, orgId));
    
  const commsCount = allEvents.reduce((acc, ev) => {
    if (ev.commsPlan && Array.isArray(ev.commsPlan)) {
      return acc + ev.commsPlan.length;
    }
    return acc;
  }, 0);

  return {
    savedBlueprints: Number(blueprintAgg?.total ?? 0),
    savedSpeakers: Number(speakerAgg?.total ?? 0),
    savedOperations: uniqueDepartments.size,
    savedCommunications: commsCount,
  };
}

export async function getRecentReuseActivity(orgId: string, limitCount = 5) {
  return db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.organizationId, orgId),
        or(
          ilike(auditLogs.action, "%reuse%"),
          ilike(auditLogs.action, "%applied%"),
          ilike(auditLogs.action, "%draft%")
        )
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limitCount);
}

export async function getSpeakers(eventId: string) {
  await ensureSeed();
  return db.select().from(speakers).where(eq(speakers.eventId, eventId));
}

export async function getSessions(eventId: string) {
  await ensureSeed();
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.eventId, eventId))
    .orderBy(asc(sessions.day), asc(sessions.startsAt));
}

export async function getRegistrations(eventId: string, limit = 200) {
  await ensureSeed();
  return db
    .select()
    .from(registrations)
    .where(eq(registrations.eventId, eventId))
    .orderBy(desc(registrations.createdAt))
    .limit(limit);
}

export async function getRegistrationByTicketCode(ticketCode: string) {
  await ensureSeed();
  return db
    .select()
    .from(registrations)
    .where(eq(registrations.ticketCode, ticketCode))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export async function getVolunteers(eventId: string) {
  await ensureSeed();
  return db
    .select()
    .from(volunteers)
    .where(eq(volunteers.eventId, eventId))
    .orderBy(asc(volunteers.department));
}

export async function getTasks(orgId: string, eventId?: string) {
  await ensureSeed();
  const base = db.select().from(tasks);
  return eventId
    ? base.where(eq(tasks.eventId, eventId)).orderBy(asc(tasks.dueAt))
    : base
        .where(eq(tasks.organizationId, orgId))
        .orderBy(asc(tasks.dueAt))
        .limit(24);
}


export async function getCertificate(code: string) {
  await ensureSeed();
  return db
    .select({
      certificate: certificates,
      registration: registrations,
      event: events,
    })
    .from(certificates)
    .innerJoin(
      registrations,
      eq(certificates.registrationId, registrations.id)
    )
    .innerJoin(events, eq(certificates.eventId, events.id))
    .where(eq(certificates.verificationCode, code))
    .limit(1)
    .then((r) => r[0] ?? null);
}

export type EventStats = {
  registered: number;
  checkedIn: number;
  revenue: number;
  pendingPayments: number;
  accommodation: number;
  transport: number;
  volunteerCount: number;
  confirmedVolunteers: number;
  openTasks: number;
  sessionCount: number;
};

export async function getEventStats(eventId: string): Promise<EventStats> {
  if (!eventId || eventId === "undefined") {
    return {
      registered: 0,
      checkedIn: 0,
      revenue: 0,
      pendingPayments: 0,
      accommodation: 0,
      transport: 0,
      volunteerCount: 0,
      confirmedVolunteers: 0,
      openTasks: 0,
      sessionCount: 0,
    };
  }
  await ensureSeed();

  const [regAgg] = await db
    .select({
      registered: count(),
      revenue: sum(registrations.amount),
      accommodation: sql<number>`coalesce(sum(case when ${registrations.accommodation} then 1 else 0 end), 0)`,
      transport: sql<number>`coalesce(sum(case when ${registrations.transport} then 1 else 0 end), 0)`,
    })
    .from(registrations)
    .where(eq(registrations.eventId, eventId));

  const [checkAgg] = await db
    .select({ checkedIn: count() })
    .from(checkIns)
    .where(eq(checkIns.eventId, eventId));

  const [payAgg] = await db
    .select({ pending: count() })
    .from(payments)
    .where(
      and(eq(payments.eventId, eventId), eq(payments.status, "pending"))
    );

  const [volAgg] = await db
    .select({ total: count() })
    .from(volunteers)
    .where(eq(volunteers.eventId, eventId));

  const [volConfirmed] = await db
    .select({ total: count() })
    .from(volunteers)
    .where(
      and(eq(volunteers.eventId, eventId), eq(volunteers.status, "confirmed"))
    );

  const [taskAgg] = await db
    .select({ open: count() })
    .from(tasks)
    .where(
      and(eq(tasks.eventId, eventId), eq(tasks.status, "not_started"))
    );

  const [sessionAgg] = await db
    .select({ total: count() })
    .from(sessions)
    .where(eq(sessions.eventId, eventId));

  return {
    registered: Number(regAgg?.registered ?? 0),
    checkedIn: Number(checkAgg?.checkedIn ?? 0),
    revenue: Number(regAgg?.revenue ?? 0),
    pendingPayments: Number(payAgg?.pending ?? 0),
    accommodation: Number(regAgg?.accommodation ?? 0),
    transport: Number(regAgg?.transport ?? 0),
    volunteerCount: Number(volAgg?.total ?? 0),
    confirmedVolunteers: Number(volConfirmed?.total ?? 0),
    openTasks: Number(taskAgg?.open ?? 0),
    sessionCount: Number(sessionAgg?.total ?? 0),
  };
}

export async function getRecentCheckIns(eventId: string, limit = 12) {
  await ensureSeed();
  return db
    .select({
      id: checkIns.id,
      checkedInAt: checkIns.checkedInAt,
      method: checkIns.method,
      gate: checkIns.gate,
      staffName: checkIns.staffName,
      firstName: registrations.firstName,
      lastName: registrations.lastName,
      ticketCode: registrations.ticketCode,
    })
    .from(checkIns)
    .innerJoin(
      registrations,
      eq(checkIns.registrationId, registrations.id)
    )
    .where(eq(checkIns.eventId, eventId))
    .orderBy(desc(checkIns.checkedInAt))
    .limit(limit);
}

export async function getOrganizationHeadline() {
  await ensureSeed();
  const org = await getOrganization();
  if (!org) return null;

  const [eventAgg] = await db
    .select({ total: count() })
    .from(events)
    .where(eq(events.organizationId, org.id));

  return {
    org,
    eventCount: Number(eventAgg?.total ?? 0),
  };
}

export async function getAllPublicEvents(filters?: { query?: string; city?: string; category?: string }) {
  await ensureSeed();
  
  const conditions = [
    eq(events.visibility, "public"),
    eq(events.status, "published")
  ];

  if (filters?.query) {
    conditions.push(
      or(
        ilike(events.title, `%${filters.query}%`),
        ilike(events.theme, `%${filters.query}%`),
        ilike(events.tagline, `%${filters.query}%`),
        ilike(organizations.name, `%${filters.query}%`)
      ) as any
    );
  }

  if (filters?.city) {
    conditions.push(eq(events.city, filters.city));
  }

  if (filters?.category) {
    conditions.push(eq(events.eventType, filters.category));
  }

  return db
    .select({
      event: events,
      organization: organizations,
    })
    .from(events)
    .innerJoin(organizations, eq(events.organizationId, organizations.id))
    .where(and(...conditions))
    .orderBy(asc(events.startsAt));
}

export async function getBlueprints(orgId: string) {
  const allBlueprints = await db.query.blueprints.findMany({
    where: eq(blueprints.organizationId, orgId),
    orderBy: [desc(blueprints.createdAt)],
  });

  // Count real usage — events whose blueprintId matches this blueprint
  const usageCounts = await db
    .select({ blueprintId: events.blueprintId, total: count() })
    .from(events)
    .where(eq(events.organizationId, orgId))
    .groupBy(events.blueprintId);

  const usageMap = new Map(
    usageCounts
      .filter((r) => r.blueprintId != null)
      .map((r) => [r.blueprintId!, Number(r.total)])
  );

  return allBlueprints.map((bp) => {
    const s = bp.structure as any;
    return {
      id: bp.id,
      name: bp.name,
      description: bp.description,
      category: s.eventType || "General",
      useCount: usageMap.get(bp.id) ?? 0,
      lastUsedAt: bp.createdAt,
      includes: [
        "Registration flow",
        s.ticketTypes?.length ? `${s.ticketTypes.length} Ticket tiers` : null,
        s.customQuestions?.length ? `${s.customQuestions.length} Custom questions` : null,
        s.sessions?.length ? `${s.sessions.length} Sessions` : null,
      ].filter(Boolean),
    };
  });
}

export async function getAuditLogs(orgId: string, limitCount = 8) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limitCount);
}

/** Returns ticket type names + real sold/capacity counts for the dashboard distribution widget. */
export async function getEventTicketDistribution(eventId: string) {
  return db
    .select({
      name: ticketTypes.name,
      sold: ticketTypes.sold,
      capacity: ticketTypes.capacity,
    })
    .from(ticketTypes)
    .where(eq(ticketTypes.eventId, eventId))
    .orderBy(asc(ticketTypes.sortOrder));
}
