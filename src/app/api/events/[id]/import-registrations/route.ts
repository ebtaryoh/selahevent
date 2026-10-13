import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { events, registrations, attendees, ticketTypes, payments } from "@/db/schema";
import { getOrganization, requirePermission } from "@/lib/data";

function randomToken(bytes = 6) {
  return randomBytes(bytes).toString("hex").toUpperCase();
}

function parseCsv(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let curr = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        curr += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(curr.trim());
      curr = "";
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(curr.trim());
      if (row.some(cell => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      curr = "";
    } else {
      curr += char;
    }
  }

  if (curr.length > 0 || row.length > 0) {
    row.push(curr.trim());
    if (row.some(cell => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const actor = await requirePermission("registrations.write");
    const org = await getOrganization();

    if (!actor || !org) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event || event.organizationId !== org.id) {
      return NextResponse.json({ ok: false, error: "Event not found or unauthorized" }, { status: 404 });
    }

    const body = await req.json();
    const { csvContent, defaultTicketTypeId } = body;

    if (!csvContent || typeof csvContent !== "string") {
      return NextResponse.json({ ok: false, error: "Please provide valid CSV content" }, { status: 400 });
    }

    const rows = parseCsv(csvContent);
    if (rows.length < 2) {
      return NextResponse.json({ ok: false, error: "CSV file is empty or missing data rows" }, { status: 400 });
    }

    const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
    const findIndex = (aliases: string[]) =>
      headers.findIndex(h => aliases.some(alias => h.includes(alias)));

    const colFirstName = findIndex(["firstname", "first"]);
    const colLastName = findIndex(["lastname", "last", "surname"]);
    const colFullName = findIndex(["fullname", "name", "attendee"]);
    const colEmail = findIndex(["email", "mail"]);
    const colPhone = findIndex(["phone", "tel", "mobile", "whatsapp", "contact"]);
    const colChurch = findIndex(["church", "ministry", "parish", "denomination"]);
    const colTicket = findIndex(["ticket", "package", "tier", "type"]);
    const colGender = findIndex(["gender", "sex"]);
    const colTable = findIndex(["table", "tableno", "tablenumber"]);
    const colSeat = findIndex(["seat", "seatno", "seatnumber"]);

    // Fetch existing ticket types for name matching
    const eventTickets = await db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, event.id));

    const prefix = (event.slug.match(/^[a-z]{2,3}/)?.[0] ?? "EV").slice(0, 3).toUpperCase();
    const errors: string[] = [];
    let importedCount = 0;
    let skippedCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || row.every(c => !c)) {
        continue;
      }

      let firstName = colFirstName !== -1 ? (row[colFirstName] || "").trim() : "";
      let lastName = colLastName !== -1 ? (row[colLastName] || "").trim() : "";

      if ((!firstName || !lastName) && colFullName !== -1 && row[colFullName]) {
        const parts = row[colFullName].trim().split(/\s+/);
        if (parts.length >= 2) {
          firstName = firstName || parts[0];
          lastName = lastName || parts.slice(1).join(" ");
        } else if (parts.length === 1) {
          firstName = firstName || parts[0];
          lastName = lastName || "Member";
        }
      }

      if (!firstName) {
        skippedCount++;
        errors.push(`Row ${i + 1}: Skipped (Missing first name)`);
        continue;
      }
      if (!lastName) {
        lastName = "Member";
      }

      let email = colEmail !== -1 ? (row[colEmail] || "").trim().toLowerCase() : "";
      const phone = colPhone !== -1 ? (row[colPhone] || "").trim() : "";
      const church = colChurch !== -1 ? (row[colChurch] || "").trim() : "";
      const genderRaw = colGender !== -1 ? (row[colGender] || "").trim().toLowerCase() : "";
      const gender = genderRaw.startsWith("m") ? "male" : genderRaw.startsWith("f") ? "female" : null;
      const tableNumber = colTable !== -1 ? (row[colTable] || "").trim() : null;
      const seatNumber = colSeat !== -1 ? (row[colSeat] || "").trim() : null;

      // If email is missing, generate an offline roster placeholder email
      if (!email || !email.includes("@")) {
        const cleanName = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        email = `${cleanName}.${randomToken(3).toLowerCase()}@roster.selah.local`;
      }

      // Ticket matching
      let assignedTicketId = defaultTicketTypeId || null;
      if (colTicket !== -1 && row[colTicket]) {
        const query = row[colTicket].trim().toLowerCase();
        const matched = eventTickets.find(
          t => t.name.toLowerCase() === query || t.name.toLowerCase().includes(query)
        );
        if (matched) {
          assignedTicketId = matched.id;
        }
      }

      try {
        await db.transaction(async tx => {
          // 1. Upsert attendee
          const [attendee] = await tx
            .insert(attendees)
            .values({
              organizationId: event.organizationId,
              email,
              firstName,
              lastName,
              phone,
            })
            .onConflictDoUpdate({
              target: [attendees.organizationId, attendees.email],
              set: {
                firstName,
                lastName,
                phone: phone || sql`attendees.phone`,
              },
            })
            .returning();

          // 2. Generate unique codes
          const code = `${prefix}-${randomToken(4)}`;
          const ticketCode = `TKT-${randomToken(6)}`;

          // 3. Create registration
          const [reg] = await tx
            .insert(registrations)
            .values({
              eventId: event.id,
              attendeeId: attendee.id,
              ticketTypeId: assignedTicketId,
              code,
              ticketCode,
              firstName,
              lastName,
              email,
              phone,
              church,
              gender,
              tableNumber,
              seatNumber,
              status: "confirmed",
              source: "roster_import",
              amount: 0,
            })
            .returning();

          // 4. Create confirmed payment record
          await tx.insert(payments).values({
            registrationId: reg.id,
            eventId: event.id,
            amount: 0,
            currency: event.currency || "NGN",
            gateway: "offline_roster",
            gatewayReference: `ROSTER_${randomToken(8)}`,
            status: "paid",
            verified: true,
            paidAt: new Date(),
          });

          // 5. Increment ticket sold count if ticket type assigned
          if (assignedTicketId) {
            await tx
              .update(ticketTypes)
              .set({ sold: sql`${ticketTypes.sold} + 1` })
              .where(eq(ticketTypes.id, assignedTicketId));
          }
        });

        importedCount++;
      } catch (rowError: any) {
        console.error(`Error importing row ${i + 1}:`, rowError);
        skippedCount++;
        errors.push(`Row ${i + 1} (${firstName} ${lastName}): ${rowError.message || "Failed to save"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 10),
      totalRows: rows.length - 1,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "An unexpected error occurred during CSV import" },
      { status: 500 }
    );
  }
}
