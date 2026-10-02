import { NextResponse } from "next/server";
import { getEventById, getRegistrations } from "@/lib/data";
import { getOrgSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return new NextResponse("Missing eventId", { status: 400 });
  }

  // Never trust a client-controlled organization cookie for authorization.
  // The organization must come from the signed organizer session.
  const session = await getOrgSession();

  if (!session?.orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch event and verify it belongs to the authenticated organization.
  const event = await getEventById(eventId);

  if (!event || event.organizationId !== session.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Fetch all registrations
  const eventRegistrations = await getRegistrations(eventId, 10000);

  // Extract dynamic headers from custom questions
  const customHeaders = event.customQuestions?.map((q: any) => q.label) || [];
  const baseHeaders = [
    "Code",
    "Status",
    "First Name",
    "Last Name",
    "Email",
    "City",
    "Country",
    "Accommodation",
    "Transport",
    "Amount Paid",
    "Registration Date"
  ];

  const headers = [...baseHeaders, ...customHeaders];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = eventRegistrations.map((reg: any) => {
    const baseFields = [
      reg.code,
      reg.status,
      reg.firstName,
      reg.lastName,
      reg.email,
      reg.city,
      reg.country,
      reg.accommodation ? "Yes" : "No",
      reg.transport ? "Yes" : "No",
      reg.amount,
      reg.createdAt?.toISOString()
    ];

    const customFields = event.customQuestions?.map((q: any) => {
      const answers = reg.customAnswers as Record<string, string> | null;
      return answers ? (answers[q.id] || "") : "";
    }) || [];

    return [...baseFields, ...customFields].map(escapeCsv).join(",");
  });

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${event.slug}.csv"`,
    }
  });
}
