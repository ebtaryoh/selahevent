"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageSquare,
  BadgeCheck,
  Pencil,
  Download,
  Filter,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

export interface VolunteerItem {
  id: string;
  name: string;
  department: string;
  role: string;
  shift: string;
  phone: string;
  status: string;
  isLeader: boolean;
  createdAt?: Date | string | null;
}

export function DashboardVolunteersManager({
  eventId,
  eventTitle,
  initialVolunteers,
  availableUnits,
}: {
  eventId: string;
  eventTitle: string;
  initialVolunteers: VolunteerItem[];
  availableUnits?: string[];
}) {
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Dynamic unique list of departments from volunteers + predefined units
  const departments = useMemo(() => {
    const set = new Set<string>();
    if (availableUnits) {
      availableUnits.forEach((u) => set.add(u));
    }
    initialVolunteers.forEach((v) => {
      if (v.department) set.add(v.department);
    });
    return Array.from(set).sort();
  }, [availableUnits, initialVolunteers]);

  // Filtered volunteers
  const filtered = useMemo(() => {
    return initialVolunteers.filter((v) => {
      const matchesSearch =
        search.trim() === "" ||
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.phone.includes(search) ||
        v.department.toLowerCase().includes(search.toLowerCase()) ||
        v.role.toLowerCase().includes(search.toLowerCase());

      const matchesUnit =
        selectedUnit === "all" || v.department.toLowerCase() === selectedUnit.toLowerCase();

      const matchesStatus =
        selectedStatus === "all" || v.status.toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesUnit && matchesStatus;
    });
  }, [initialVolunteers, search, selectedUnit, selectedStatus]);

  // KPI calculations
  const totalCount = initialVolunteers.length;
  const confirmedCount = initialVolunteers.filter((v) => v.status === "confirmed").length;
  const leaderCount = initialVolunteers.filter((v) => v.isLeader).length;

  // Counts per department
  const unitCounts = useMemo(() => {
    const map: Record<string, number> = {};
    initialVolunteers.forEach((v) => {
      const dep = v.department || "General";
      map[dep] = (map[dep] || 0) + 1;
    });
    return map;
  }, [initialVolunteers]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["Name", "Ministry Unit / Department", "Role", "Shift", "Phone", "Status", "Is Leader"];
    const rows = filtered.map((v) => [
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.department.replace(/"/g, '""')}"`,
      `"${v.role.replace(/"/g, '""')}"`,
      `"${v.shift.replace(/"/g, '""')}"`,
      `"${v.phone.replace(/"/g, '""')}"`,
      `"${v.status.replace(/"/g, '""')}"`,
      v.isLeader ? "Yes" : "No",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `volunteers_${eventTitle.replace(/[^a-zA-Z0-9]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* KPI Overview Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
              Total Workforce
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/15 text-brass">
              <Users size={16} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-display font-semibold text-ink">{totalCount}</div>
          <div className="mt-1 text-xs text-warm-400">Serving across {departments.length} ministry units</div>
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
              Confirmed &amp; Ready
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-display font-semibold text-emerald-500">{confirmedCount}</div>
          <div className="mt-1 text-xs text-warm-400">
            {totalCount > 0 ? `${Math.round((confirmedCount / totalCount) * 100)}% active confirmation` : "Awaiting signups"}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-warm-500 uppercase tracking-wider">
              Appointed Leads
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
              <BadgeCheck size={16} />
            </div>
          </div>
          <div className="mt-2 text-3xl font-display font-semibold text-amber-500">{leaderCount}</div>
          <div className="mt-1 text-xs text-warm-400">HODs and unit captains assigned</div>
        </div>
      </div>

      {/* Controls Bar: Search, Filters, CSV Export, Add Volunteer */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by volunteer name, phone, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input !pl-10 !py-2.5 !text-xs w-full"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input !py-2.5 !text-xs !w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="declined">Declined</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="btn btn-secondary !py-2 !px-3.5 !text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download size={14} /> Export CSV Roster
          </button>
          <Link
            href={`/dashboard/events/${eventId}/volunteers/new`}
            className="btn btn-primary !py-2 !px-4 !text-xs flex items-center gap-1.5"
          >
            <Plus size={15} /> Add Volunteer
          </Link>
        </div>
      </div>

      {/* Ministry Unit Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[var(--card-border)]">
        <button
          type="button"
          onClick={() => setSelectedUnit("all")}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            selectedUnit === "all"
              ? "bg-brass text-black shadow-sm"
              : "bg-paper text-warm-500 hover:text-ink hover:bg-brass/10"
          }`}
        >
          All Units ({totalCount})
        </button>
        {departments.map((dept) => {
          const count = unitCounts[dept] || 0;
          const isActive = selectedUnit.toLowerCase() === dept.toLowerCase();
          return (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedUnit(dept)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-brass text-black shadow-sm"
                  : "bg-paper text-warm-500 hover:text-ink hover:bg-brass/10 border border-white/5"
              }`}
            >
              <span>{dept}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[0.68rem] font-bold ${
                  isActive ? "bg-black/20 text-black" : "bg-white/10 text-warm-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Volunteers Roster Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card-bg)] py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brass/10 text-brass mb-3">
            <Users size={28} />
          </div>
          <h3 className="text-base font-semibold text-ink">No volunteers found</h3>
          <p className="mt-1 text-xs text-warm-500 max-w-sm leading-relaxed">
            {search || selectedUnit !== "all" || selectedStatus !== "all"
              ? "No volunteers match your current search and unit filter."
              : "No volunteers have been registered or added yet. Attendees can sign up during checkout."}
          </p>
          {(search || selectedUnit !== "all" || selectedStatus !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedUnit("all");
                setSelectedStatus("all");
              }}
              className="mt-4 text-xs font-semibold text-brass hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((volunteer) => {
            const cleanPhone = volunteer.phone.replace(/[^0-9+]/g, "");
            const whatsappText = encodeURIComponent(
              `Peace be with you ${volunteer.name}! This is from the coordination team for ${eventTitle}. We have you confirmed for the ${volunteer.department} unit (${volunteer.role}).`
            );

            return (
              <div
                key={volunteer.id}
                className={`flex flex-col justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-all shadow-sm hover:shadow-md ${
                  volunteer.status === "declined" ? "opacity-60" : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink flex items-center gap-1.5">
                        {volunteer.name}
                        {volunteer.isLeader && (
                          <span
                            title="Team Leader / Head of Department"
                            className="inline-flex items-center text-amber-500"
                          >
                            <BadgeCheck size={16} />
                          </span>
                        )}
                      </h3>
                      <div className="text-xs font-semibold text-brass mt-0.5">
                        {volunteer.department}
                      </div>
                      <div className="text-[0.75rem] text-warm-400 mt-0.5">
                        {volunteer.role}
                      </div>
                    </div>

                    <span
                      className={`pill text-[0.68rem] font-bold uppercase tracking-wider ${
                        volunteer.status === "confirmed"
                          ? "pill-green"
                          : volunteer.status === "pending"
                          ? "pill-neutral"
                          : "pill-neutral opacity-50"
                      }`}
                    >
                      {volunteer.status}
                    </span>
                  </div>

                  {(volunteer.shift || volunteer.phone) && (
                    <div className="mt-4 space-y-1.5 text-xs text-warm-500 border-t border-[var(--card-border)] pt-3">
                      {volunteer.shift && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-warm-400 shrink-0" />
                          <span>Shift: <strong className="text-ink font-medium">{volunteer.shift}</strong></span>
                        </div>
                      )}
                      {volunteer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone size={13} className="text-warm-400 shrink-0" />
                          <span className="font-mono text-ink">{volunteer.phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--card-border)] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {cleanPhone && (
                      <>
                        <a
                          href={`tel:${cleanPhone}`}
                          title={`Call ${volunteer.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper border border-white/10 text-warm-400 hover:text-ink hover:bg-brass/10 transition-colors"
                        >
                          <Phone size={13} />
                        </a>
                        <a
                          href={`https://wa.me/${cleanPhone.replace("+", "")}?text=${whatsappText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp message to ${volunteer.name}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <MessageSquare size={13} />
                        </a>
                      </>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/events/${eventId}/volunteers/${volunteer.id}/edit`}
                    className="btn btn-ghost !py-1 !px-2.5 !text-xs text-warm-500 hover:text-ink flex items-center gap-1"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
