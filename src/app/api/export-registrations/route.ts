import { NextResponse } from "next/server";
import { getEventById, getRegistrations, getTickets } from "@/lib/data";
import { getOrgSession } from "@/lib/session";
import { requirePermission } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");
  const ticketTypeId = searchParams.get("ticketTypeId");
  const lodging = searchParams.get("lodging");

  if (!eventId) return new NextResponse("Missing eventId", { status: 400 });

  const actor = await requirePermission("exports.read");
  const session = await getOrgSession();
  if (!session?.orgId) return new NextResponse("Unauthorized", { status: 401 });

  const event = await getEventById(eventId);
  if (!event || event.organizationId !== session.orgId) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const [eventRegistrations, eventTickets] = await Promise.all([
    getRegistrations(eventId, 10000),
    getTickets(eventId),
  ]);

  const ticketMap = new Map(eventTickets.map((t) => [t.id, t.name]));

  let filtered = eventRegistrations;
  if (ticketTypeId && ticketTypeId !== "all") {
    filtered = filtered.filter((r) => r.ticketTypeId === ticketTypeId);
  }
  if (lodging && lodging !== "all") {
    if (lodging === "paid") {
      filtered = filtered.filter((r) => r.accommodation && r.accommodationType === "paid");
    } else if (lodging === "free") {
      filtered = filtered.filter((r) => r.accommodation && r.accommodationType !== "paid");
    } else if (lodging === "free_male") {
      filtered = filtered.filter(
        (r) => r.accommodation && r.accommodationType !== "paid" && r.gender === "male"
      );
    } else if (lodging === "free_female") {
      filtered = filtered.filter(
        (r) => r.accommodation && r.accommodationType !== "paid" && r.gender === "female"
      );
    } else if (lodging === "none") {
      filtered = filtered.filter((r) => !r.accommodation);
    }
  }

  const customHeaders = event.customQuestions?.map((q: any) => q.label) || [];
  const baseHeaders = [
    "Code",
    "Ticket Code",
    "Status",
    "Ticket Package",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Gender",
    "Age Bracket",
    "Occupation",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "City",
    "Country",
    "Table Number",
    "Seat Number",
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
  const rows = filtered.map((reg: any) => {
    const packageName = reg.ticketTypeId
      ? ticketMap.get(reg.ticketTypeId) || reg.attendeeType || "Standard"
      : reg.attendeeType || "Standard";

    const baseFields = [
      reg.code,
      reg.ticketCode,
      reg.status,
      packageName,
      reg.firstName,
      reg.lastName,
      reg.email,
      reg.phone || "",
      reg.gender || "",
      reg.ageBracket || "",
      reg.occupation || "",
      reg.emergencyName || "",
      reg.emergencyPhone || "",
      reg.city || "",
      reg.country || "",
      reg.tableNumber || "",
      reg.seatNumber || "",
      reg.accommodation
        ? reg.accommodationType === "paid"
          ? "Paid Room Upgrade"
          : reg.gender
            ? `Free Dorm (${reg.gender === "male" ? "Men's Dorm" : "Women's Dorm"})`
            : "Free Dorm"
        : "No",
      reg.transport ? "Yes" : "No",
      reg.amount,
      reg.createdAt ? new Date(reg.createdAt).toISOString() : "",
    ];

    const answers = reg.customAnswers as Record<string, string> | null;
    const customFields = event.customQuestions?.map((q: any) => answers?.[q.id] || "") || [];
    return [...baseFields, ...customFields].map(escapeCsv).join(",");
  });

  const filenameSuffix =
    ticketTypeId && ticketTypeId !== "all"
      ? `-${ticketMap.get(ticketTypeId)?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "package"}`
      : "";

  return new NextResponse([headers.map(escapeCsv).join(","), ...rows].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="registrations-${event.slug}${filenameSuffix}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
