"use client";

import { useState, useMemo } from "react";
import {
  Download,
  Filter,
  Search,
  Ticket,
  BedDouble,
  Users,
  X,
  CreditCard,
  Building,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { AttendeeSeatingModal } from "@/components/attendee-seating-modal";
import { AttendeeCsvImportModal } from "@/components/attendee-csv-import-modal";
import { WhatsAppShareButton } from "@/components/whatsapp-share-button";
import { formatDate, formatMoney, formatNumber, titleCase } from "@/lib/format";

export interface TicketTypeItem {
  id: string;
  name: string;
  price: number;
  currency?: string;
  badge?: string | null;
  capacity?: number;
  sold?: number;
}

export interface RegistrationItem {
  id: string;
  eventId: string;
  ticketTypeId?: string | null;
  code: string;
  ticketCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  church?: string | null;
  attendeeType?: string | null;
  gender?: string | null;
  ageBracket?: string | null;
  occupation?: string | null;
  tableNumber?: string | null;
  seatNumber?: string | null;
  status: string;
  accommodation?: boolean | null;
  accommodationType?: string | null;
  transport?: boolean | null;
  dietary?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  amount: number;
  customAnswers?: Record<string, any> | null;
  createdAt: Date | string;
}

interface AttendeeLedgerTableProps {
  eventId: string;
  currency: string;
  eventSlug: string;
  eventTitle: string;
  venueName?: string;
  registrations: RegistrationItem[];
  tickets: TicketTypeItem[];
  customQuestions?: Array<{ id: string; label: string; type: string }>;
}

export function AttendeeLedgerTable({
  eventId,
  currency,
  eventSlug,
  eventTitle,
  venueName,
  registrations,
  tickets,
  customQuestions = [],
}: AttendeeLedgerTableProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<string>("all");
  const [selectedLodging, setSelectedLodging] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Map ticket IDs to ticket details
  const ticketMap = useMemo(() => {
    const map = new Map<string, TicketTypeItem>();
    tickets.forEach((t) => map.set(t.id, t));
    return map;
  }, [tickets]);

  // Calculate counts per ticket package
  const packageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let unassigned = 0;

    registrations.forEach((reg) => {
      if (reg.ticketTypeId && ticketMap.has(reg.ticketTypeId)) {
        counts[reg.ticketTypeId] = (counts[reg.ticketTypeId] || 0) + 1;
      } else {
        unassigned += 1;
      }
    });

    return { counts, unassigned };
  }, [registrations, ticketMap]);

  // Calculate counts for lodging
  const lodgingCounts = useMemo(() => {
    let paid = 0;
    let free = 0;
    let none = 0;

    registrations.forEach((reg) => {
      if (!reg.accommodation) {
        none += 1;
      } else if (reg.accommodationType === "paid") {
        paid += 1;
      } else {
        free += 1;
      }
    });

    return { paid, free, none };
  }, [registrations]);

  // Filter registrations based on active filters & search query
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      // Package filter
      if (selectedTicketId !== "all") {
        if (selectedTicketId === "unassigned") {
          if (reg.ticketTypeId && ticketMap.has(reg.ticketTypeId)) return false;
        } else if (reg.ticketTypeId !== selectedTicketId) {
          return false;
        }
      }

      // Lodging filter
      if (selectedLodging !== "all") {
        if (selectedLodging === "paid") {
          if (!reg.accommodation || reg.accommodationType !== "paid") return false;
        } else if (selectedLodging === "free") {
          if (!reg.accommodation || reg.accommodationType === "paid") return false;
        } else if (selectedLodging === "none") {
          if (reg.accommodation) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${reg.firstName} ${reg.lastName}`.toLowerCase();
        const email = (reg.email || "").toLowerCase();
        const phone = (reg.phone || "").toLowerCase();
        const code = (reg.code || "").toLowerCase();
        const ticketCode = (reg.ticketCode || "").toLowerCase();
        const table = (reg.tableNumber || "").toLowerCase();

        const matches =
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          code.includes(query) ||
          ticketCode.includes(query) ||
          table.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [registrations, selectedTicketId, selectedLodging, searchQuery, ticketMap]);

  // Filtered revenue
  const filteredRevenue = useMemo(() => {
    return filteredRegistrations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredRegistrations]);

  // Export CSV URL
  const exportUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("eventId", eventId);
    if (selectedTicketId !== "all") params.set("ticketTypeId", selectedTicketId);
    if (selectedLodging !== "all") params.set("lodging", selectedLodging);
    return `/api/export-registrations?${params.toString()}`;
  }, [eventId, selectedTicketId, selectedLodging]);

  const activeTicket = selectedTicketId !== "all" && selectedTicketId !== "unassigned" ? ticketMap.get(selectedTicketId) : null;

  return (
    <div className="space-y-6">
      {/* 1. Ticket Package Filter Pills */}
      <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Ticket size={18} className="text-[var(--color-brass-deep)]" />
            <h3 className="font-display text-[1.05rem] font-semibold text-ink">
              Filter by Ticket Package
            </h3>
            <span className="text-xs text-warm-500 font-medium">
              ({tickets.length} {tickets.length === 1 ? "tier" : "tiers"} created)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-warm-500">
              Showing: <strong className="text-ink">{filteredRegistrations.length}</strong> of{" "}
              {registrations.length} attendees
            </span>
            {(selectedTicketId !== "all" || selectedLodging !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTicketId("all");
                  setSelectedLodging("all");
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1 font-semibold text-[var(--color-brass-deep)] hover:underline cursor-pointer"
              >
                <X size={13} /> Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Package Pills */}
        <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-[rgba(22,19,17,0.06)]">
          <button
            type="button"
            onClick={() => setSelectedTicketId("all")}
            className={`cursor-pointer inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              selectedTicketId === "all"
                ? "bg-cypress text-parchment shadow-xs"
                : "bg-warm-100 text-warm-700 hover:bg-warm-200/80"
            }`}
          >
            All Packages
            <span
              className={`rounded-full px-1.5 py-0.2 text-[0.6875rem] ${
                selectedTicketId === "all"
                  ? "bg-white/20 text-parchment"
                  : "bg-warm-200 text-warm-700"
              }`}
            >
              {registrations.length}
            </span>
          </button>

          {tickets.map((t) => {
            const count = packageCounts.counts[t.id] || 0;
            const isSelected = selectedTicketId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTicketId(t.id)}
                className={`cursor-pointer inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-cypress text-parchment shadow-xs"
                    : "bg-warm-100 text-warm-700 hover:bg-warm-200/80"
                }`}
              >
                <span>{t.name}</span>
                {t.badge && (
                  <span
                    className={`pill !text-[0.6rem] !py-0 !px-1.5 ${
                      isSelected
                        ? "border-brass-light/40 bg-brass-light/20 text-brass-light"
                        : "border-[rgba(192,138,46,0.3)] bg-[rgba(192,138,46,0.1)] text-[var(--color-brass-deep)]"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[0.6875rem] ${
                    isSelected
                      ? "bg-white/20 text-parchment"
                      : "bg-warm-200 text-warm-700 font-bold"
                  }`}
                >
                  {count}
                </span>
                <span className="text-[0.6875rem] opacity-75">
                  ({t.price === 0 ? "Free" : formatMoney(t.price, t.currency || currency)})
                </span>
              </button>
            );
          })}

          {packageCounts.unassigned > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTicketId("unassigned")}
              className={`cursor-pointer inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                selectedTicketId === "unassigned"
                  ? "bg-cypress text-parchment shadow-xs"
                  : "bg-warm-100 text-warm-700 hover:bg-warm-200/80"
              }`}
            >
              Standard / General
              <span className="rounded-full bg-warm-200 px-1.5 py-0.2 text-[0.6875rem] text-warm-700">
                {packageCounts.unassigned}
              </span>
            </button>
          )}
        </div>

        {/* 2. Lodging Sub-Filter Pills */}
        <div className="mt-4 pt-3 border-t border-[rgba(22,19,17,0.06)] flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-warm-500 mr-1 flex items-center gap-1">
            <BedDouble size={14} /> Lodging Filter:
          </span>
          {[
            { id: "all", label: "All Hospitality", count: registrations.length },
            { id: "paid", label: "Paid Room Upgrades", count: lodgingCounts.paid },
            { id: "free", label: "Free Dorms", count: lodgingCounts.free },
            { id: "none", label: "No Lodging", count: lodgingCounts.none },
          ].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelectedLodging(l.id)}
              className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedLodging === l.id
                  ? "bg-[var(--color-brass-deep)] text-white font-semibold"
                  : "bg-warm-100/70 text-warm-600 hover:bg-warm-200/60"
              }`}
            >
              {l.label} ({l.count})
            </button>
          ))}
        </div>
      </div>

      {/* 3. Search Bar + Export CSV Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400"
          />
          <input
            type="text"
            placeholder="Search by name, email, phone, ticket code, table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input !py-2 !pl-10 !text-xs !w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-warm-500 font-medium hidden md:inline">
            Revenue from view: <strong className="text-ink">{formatMoney(filteredRevenue, currency)}</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="btn btn-primary !py-2 !px-3.5 !text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Upload size={14} /> Import Roster CSV
          </button>
          <a
            href={exportUrl}
            className="btn btn-ghost !py-2 !px-3.5 !text-xs"
            download
          >
            <Download size={14} />
            {selectedTicketId !== "all" && activeTicket
              ? `Export "${activeTicket.name}" (${filteredRegistrations.length})`
              : "Export CSV"}
          </a>
        </div>
      </div>

      {/* 4. The Attendees Ledger Table */}
      <div className="overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper shadow-xs">
        <div className="overflow-x-auto">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Code</th>
                <th scope="col">Attendee</th>
                <th scope="col">Ticket / Package</th>
                <th scope="col">Location</th>
                <th scope="col">Amount</th>
                <th scope="col">Hospitality</th>
                <th scope="col">Table / Seating</th>
                <th scope="col">Custom Answers</th>
                <th scope="col">Status</th>
                <th scope="col">WhatsApp Pass</th>
                <th scope="col">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-warm-500 text-sm">
                    No attendees match the selected package or search criteria.
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicketId("all");
                          setSelectedLodging("all");
                          setSearchQuery("");
                        }}
                        className="btn btn-ghost !py-1.5 !px-3 !text-xs cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => {
                  const ticket = reg.ticketTypeId ? ticketMap.get(reg.ticketTypeId) : null;
                  const packageName = ticket ? ticket.name : reg.attendeeType || "Standard";

                  return (
                    <tr key={reg.id} className="hover:bg-warm-50/50 transition-colors">
                      <td className="tnum whitespace-nowrap font-semibold text-[var(--color-brass-deep)]">
                        {reg.code}
                      </td>
                      <td>
                        <div className="font-semibold text-ink flex items-center gap-1.5">
                          <span>
                            {reg.firstName} {reg.lastName}
                          </span>
                          {reg.gender && (
                            <span className="pill pill-neutral !text-[0.6rem] !py-0 !px-1.5 font-normal">
                              {reg.gender === "male" ? "M" : "F"}
                            </span>
                          )}
                        </div>
                        <div className="text-[0.795rem] text-warm-400">
                          {reg.email}
                        </div>
                        {reg.phone && (
                          <div className="text-[0.725rem] text-warm-500">
                            {reg.phone}
                          </div>
                        )}
                        {(reg.occupation || reg.ageBracket) && (
                          <div className="text-[0.725rem] text-warm-500 mt-0.5">
                            {[
                              reg.occupation ? reg.occupation.replace(/_/g, " ") : null,
                              reg.ageBracket ? reg.ageBracket.replace(/_/g, " ") : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        )}
                        {(reg.emergencyName || reg.emergencyPhone) && (
                          <div className="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-warm-600 bg-warm-100/60 dark:bg-warm-900/40 border border-warm-200 dark:border-warm-800 px-2 py-0.5 rounded-md w-fit">
                            <span className="font-semibold text-brass-deep dark:text-brass">Emergency:</span>
                            <span>{reg.emergencyName || "Guardian"}</span>
                            {reg.emergencyPhone && (
                              <a
                                href={`tel:${reg.emergencyPhone.replace(/[^0-9+]/g, "")}`}
                                className="text-brass-deep dark:text-brass hover:underline ml-0.5 font-mono"
                                title="Call emergency contact"
                              >
                                {reg.emergencyPhone}
                              </a>
                            )}
                          </div>
                        )}
                      </td>
                      {/* Ticket / Package column */}
                      <td>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-semibold text-ink text-[0.845rem]">
                            {packageName}
                          </span>
                          {ticket?.badge && (
                            <span className="pill pill-live !text-[0.625rem] !py-0.2 !px-1.5 font-medium">
                              {ticket.badge}
                            </span>
                          )}
                          <span className="text-[0.725rem] text-warm-500">
                            {reg.amount > 0 ? formatMoney(reg.amount, currency) : "Free tier"}
                          </span>
                        </div>
                      </td>
                      <td className="text-warm-500">
                        {reg.city || "—"}
                        {reg.country ? `, ${reg.country}` : ""}
                      </td>
                      <td className="tnum text-ink font-semibold">
                        {formatMoney(reg.amount, currency)}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1.5">
                          {reg.accommodation ? (
                            <span
                              className={`pill !text-[0.625rem] ${
                                reg.accommodationType === "paid" ? "pill-live" : "pill-brass"
                              }`}
                            >
                              {reg.accommodationType === "paid"
                                ? "Paid Room Upgrade"
                                : `Free Dorm ${
                                    reg.gender
                                      ? `(${reg.gender === "male" ? "Men's Dorm" : "Women's Dorm"})`
                                      : ""
                                  }`}
                            </span>
                          ) : null}
                          {reg.transport ? (
                            <span className="pill pill-neutral !text-[0.625rem]">
                              Transport
                            </span>
                          ) : null}
                          {!reg.accommodation && !reg.transport ? (
                            <span className="text-[0.795rem] text-warm-300">
                              None
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <AttendeeSeatingModal
                          eventId={eventId}
                          registrationId={reg.id}
                          attendeeName={`${reg.firstName} ${reg.lastName}`}
                          currentTable={reg.tableNumber}
                          currentSeat={reg.seatNumber}
                        />
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 text-[0.795rem] text-warm-600">
                          {reg.customAnswers && Object.keys(reg.customAnswers).length > 0 ? (
                            Object.entries(reg.customAnswers).map(([k, v]) => {
                              const q = customQuestions.find((cq) => cq.id === k);
                              return (
                                <div key={k}>
                                  <span className="font-medium text-ink">
                                    {q?.label || k}:
                                  </span>{" "}
                                  {String(v)}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-warm-300">—</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={
                            reg.status === "confirmed"
                              ? "pill pill-live"
                              : reg.status === "pending"
                                ? "pill pill-warn"
                                : "pill pill-neutral"
                          }
                        >
                          {titleCase(reg.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">
                        <WhatsAppShareButton
                          payload={{
                            phone: reg.phone || "",
                            eventTitle: eventTitle,
                            attendeeName: `${reg.firstName} ${reg.lastName}`,
                            ticketCode: reg.ticketCode,
                            ticketTier: packageName,
                            tableNumber: reg.tableNumber || undefined,
                            seatNumber: reg.seatNumber || undefined,
                            venueName: venueName,
                            passUrl: `${
                              process.env.NEXT_PUBLIC_SITE_URL || "https://selahevent.vercel.app"
                            }/ticket/${reg.ticketCode}`,
                          }}
                          compact
                        />
                      </td>
                      <td className="tnum whitespace-nowrap text-warm-400">
                        {formatDate(reg.createdAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[rgba(22,19,17,0.1)] px-6 py-4">
          <p className="text-[0.8125rem] text-warm-500">
            Showing {filteredRegistrations.length} of {formatNumber(registrations.length)} registrations
            {selectedTicketId !== "all" && activeTicket ? ` in ${activeTicket.name}` : ""}
          </p>
          <div className="flex gap-2">
            <span className="text-xs text-warm-400 self-center">
              Page 1 of 1
            </span>
          </div>
        </div>
      </div>

      <AttendeeCsvImportModal
        eventId={eventId}
        tickets={tickets}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
