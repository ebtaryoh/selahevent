import { NextResponse } from "next/server";
import { getEventById, getRegistrations } from "@/lib/data";
import { getOrgSession } from "@/lib/session";
import { requirePermission } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) return new NextResponse("Missing eventId", { status: 400 });

  const actor = await requirePermission("exports.read");
  const session = await getOrgSession();
  if (!session?.orgId) return new NextResponse("Unauthorized", { status: 401 });

  const event = await getEventById(eventId);
  if (!event || event.organizationId !== session.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const eventRegistrations = await getRegistrations(eventId, 10000);
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
    "Registration Date",
  ];

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return '"' + str + '"';
  };

  const headers = [...baseHeaders, ...customHeaders];
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
      reg.createdAt?.toISOString(),
    ];

    const answers = reg.customAnswers as Record<string, string> | null;
    const customFields = event.customQuestions?.map((q: any) => answers?.[q.id] || "") || [];
    return [...baseFields, ...customFields].map(escapeCsv).join(",");
  });

  return new NextResponse([headers.map(escapeCsv).join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="registrations-' + event.slug + '.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
