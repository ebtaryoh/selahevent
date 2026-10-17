"use client";

import React, { useState } from "react";
import {
  Megaphone,
  AlertTriangle,
  Utensils,
  Bus,
  Sparkles,
  Pin,
  Trash2,
  CheckCircle2,
  Eye,
  Plus,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  isPinned: boolean;
  isActive: boolean;
  authorName: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  createdAt: string | Date;
}

interface Props {
  eventId: string;
  initialAnnouncements: Announcement[];
}

export function DashboardBroadcastsManager({ eventId, initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "announcement",
    isPinned: true,
    actionUrl: "",
    actionLabel: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1-Click Pastoral Templates
  const applyTemplate = (
    templateTitle: string,
    templateMsg: string,
    templateType: string,
    actionUrl = "",
    actionLabel = ""
  ) => {
    setForm({
      title: templateTitle,
      message: templateMsg,
      type: templateType,
      isPinned: true,
      actionUrl,
      actionLabel,
    });
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to publish");

      setAnnouncements((prev) => [data.announcement, ...prev]);
      setForm({
        title: "",
        message: "",
        type: "announcement",
        isPinned: true,
        actionUrl: "",
        actionLabel: "",
      });
      setStatusMessage("Broadcast published live to attendee screens & wallets!");
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to publish broadcast");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    try {
      const newPinned = !announcement.isPinned;
      const res = await fetch(`/api/events/${eventId}/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: newPinned }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? { ...a, isPinned: newPinned } : a))
        );
      }
    } catch {
      alert("Failed to toggle pin");
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const newActive = !announcement.isActive;
      const res = await fetch(`/api/events/${eventId}/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? { ...a, isActive: newActive } : a))
        );
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this broadcast?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}/announcements/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch {
      alert("Failed to delete announcement");
    }
  };

  return (
    <div className="space-y-8">
      {/* Broadcast Publisher */}
      <div className="card p-7 border border-brass/35 bg-paper shadow-sm rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brass-deep">
          <Megaphone size={16} /> Live Announcement &amp; Flash Alert Publisher
        </div>
        <h2 className="font-display text-2xl font-bold text-ink mt-1">
          Broadcast to Attendee Screens &amp; Wallets
        </h2>
        <p className="text-xs text-warm-500 mt-1">
          Post immediate notifications, schedule adjustments, dining calls, and emergency alerts that instantly appear at the top of the event page and digital passes.
        </p>

        {/* 1-Click Pastoral Templates */}
        <div className="mt-5 pt-4 border-t border-black/10">
          <div className="text-[0.68rem] font-bold uppercase tracking-wider text-warm-400 mb-2">
            Quick 1-Click Pastoral Presets:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  "🚨 General Assembly Schedule Notice",
                  "Due to the prophetic impartation service, the General Youth Revival session will begin promptly at 5:30 PM in the Main Auditorium. Please be seated early.",
                  "urgent",
                  "#schedule",
                  "Read Full Notice"
                )
              }
              className="text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
            >
              🚨 Schedule Notice (General Assembly)
            </button>

            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  "🍽️ Fellowship Dinner is Now Served",
                  "Dining Hall A & B are officially open for evening dinner until 8:45 PM. Please present your digital meal pass at the turnstile.",
                  "meal"
                )
              }
              className="text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              🍽️ Dinner / Lunch Served
            </button>

            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  "🚌 Late-Night Bus Shuttles Boarding Time",
                  "All returning convention shuttles to Berger, Ojota, and Abeokuta will begin boarding immediately following the closing benediction at Parking Gate 2.",
                  "shuttle"
                )
              }
              className="text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              🚌 Shuttle Boarding Call
            </button>

            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  "🌧️ Rain Advisory: Workshop Venue Moved",
                  "Due to the afternoon rain shower, the Youth Leadership Breakout has been relocated from the Canopy Lawn to Youth Auditorium B.",
                  "urgent"
                )
              }
              className="text-[0.72rem] font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              🌧️ Rain / Weather Notice
            </button>
          </div>
        </div>

        {/* Publish Form */}
        <form onSubmit={handlePublish} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Announcement Headline
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. 🚨 Evening Impartation Service Starting in 15 Minutes"
                className="input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Notice Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input w-full text-xs font-medium"
              >
                <option value="announcement">📢 Standard Announcement</option>
                <option value="urgent">🚨 Urgent / Schedule Change</option>
                <option value="meal">🍽️ Dining Hall &amp; Welfare</option>
                <option value="shuttle">🚌 Bus Shuttle &amp; Transit</option>
                <option value="spiritual">✨ Spiritual Focus / Altar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-700 mb-1">
              Full Broadcast Message
            </label>
            <textarea
              required
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Provide clear details, locations, and instructions for attendees..."
              className="input w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Action Link URL (Optional)
              </label>
              <input
                type="url"
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="https://..."
                className="input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-warm-700 mb-1">
                Action Button Label (Optional)
              </label>
              <input
                type="text"
                value={form.actionLabel}
                onChange={(e) => setForm({ ...form, actionLabel: e.target.value })}
                placeholder="e.g. View Auditorium Map"
                className="input w-full text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-semibold text-warm-700 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="rounded border-warm-300 text-brass focus:ring-brass"
              />
              Pin to top of attendee screens
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-brass !py-2.5 !px-6 text-xs font-semibold cursor-pointer flex items-center gap-2"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Megaphone size={15} />}
              Publish Live Broadcast
            </button>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-xs text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} /> {statusMessage}
            </div>
          )}
        </form>
      </div>

      {/* Broadcast Feed */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-warm-500 mb-3">
          Published Broadcasts ({announcements.length})
        </h3>

        {announcements.length === 0 ? (
          <div className="card py-12 text-center text-warm-400 text-sm">
            No broadcasts published yet. Use the form above to send an announcement to attendees.
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className={`card p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !a.isActive
                    ? "opacity-60 bg-warm-100/50 border-black/5"
                    : a.isPinned
                    ? "border-brass/40 bg-warm-50/50 shadow-xs"
                    : "border-black/10 bg-paper"
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-brass/20 text-brass-deep">
                      {a.type}
                    </span>
                    {a.isPinned && (
                      <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    {!a.isActive && (
                      <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-warm-200 text-warm-600">
                        Hidden
                      </span>
                    )}
                    <span className="text-[0.68rem] text-warm-400">
                      By {a.authorName} · {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <h4 className="font-display text-base font-bold text-ink">
                    {a.title}
                  </h4>
                  <p className="text-xs text-warm-600 leading-relaxed max-w-2xl">
                    {a.message}
                  </p>

                  {a.actionUrl && (
                    <div className="pt-1">
                      <a
                        href={a.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.72rem] text-brass-deep hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        {a.actionLabel || a.actionUrl} <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(a)}
                    className="p-2 rounded-lg text-warm-500 hover:text-ink hover:bg-warm-100 transition-colors cursor-pointer"
                    title={a.isPinned ? "Unpin broadcast" : "Pin to top"}
                  >
                    <Pin size={15} className={a.isPinned ? "fill-brass text-brass" : ""} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(a)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      a.isActive
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-warm-200 text-warm-600 hover:bg-warm-300"
                    }`}
                  >
                    {a.isActive ? "Live" : "Archived"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete announcement"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
