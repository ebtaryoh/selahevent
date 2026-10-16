"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Megaphone,
  Utensils,
  Bus,
  Sparkles,
  ChevronRight,
  X,
  Clock,
  ExternalLink,
} from "lucide-react";

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "announcement" | "meal" | "shuttle" | "spiritual" | string;
  isPinned: boolean;
  authorName: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  createdAt: string | Date;
}

interface Props {
  announcements: AnnouncementItem[];
  className?: string;
}

export function PastoralBroadcastBanner({ announcements, className = "" }: Props) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeItems = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (activeItems.length === 0) return null;

  const current = activeItems[0];
  const isExpanded = expandedId === current.id;

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "urgent":
        return {
          icon: <AlertTriangle size={16} className="text-red-400 shrink-0 animate-pulse" />,
          badge: "Urgent Notice",
          badgeClass: "bg-red-500/20 text-red-300 border-red-500/40",
          borderClass: "border-red-500/40 bg-red-950/40",
        };
      case "meal":
        return {
          icon: <Utensils size={16} className="text-emerald-400 shrink-0" />,
          badge: "Dining Hall & Welfare",
          badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          borderClass: "border-emerald-500/40 bg-emerald-950/40",
        };
      case "shuttle":
        return {
          icon: <Bus size={16} className="text-sky-400 shrink-0" />,
          badge: "Bus Shuttle Update",
          badgeClass: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          borderClass: "border-sky-500/40 bg-sky-950/40",
        };
      case "spiritual":
        return {
          icon: <Sparkles size={16} className="text-amber-400 shrink-0" />,
          badge: "Spiritual Alert",
          badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          borderClass: "border-amber-500/40 bg-amber-950/40",
        };
      default:
        return {
          icon: <Megaphone size={16} className="text-brass shrink-0" />,
          badge: "Pastoral Broadcast",
          badgeClass: "bg-brass/20 text-brass-light border-brass/40",
          borderClass: "border-brass/35 bg-[#0a231b]",
        };
    }
  };

  const config = getTypeConfig(current.type);

  return (
    <div
      className={`w-full border-b backdrop-blur-md transition-all duration-300 ${config.borderClass} ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-2.5 max-w-6xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {config.icon}

            <span
              className={`text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${config.badgeClass}`}
            >
              {config.badge}
            </span>

            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-semibold text-white text-xs sm:text-sm truncate">
                {current.title}
              </span>

              {!isExpanded && (
                <span className="hidden md:inline text-xs text-warm-300 truncate max-w-lg">
                  — {current.message}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : current.id)}
              className="text-[0.72rem] font-medium text-brass-light hover:text-white transition-colors cursor-pointer inline-flex items-center gap-0.5"
            >
              {isExpanded ? "Collapse" : "Read Full Notice"}
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={() => setDismissedIds((prev) => [...prev, current.id])}
              className="p-1 text-warm-400 hover:text-white transition-colors rounded-lg cursor-pointer"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-warm-200 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="leading-relaxed text-sm text-white/95">{current.message}</p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[0.7rem] text-warm-400">
              <span className="flex items-center gap-1">
                <Clock size={12} /> Issued by: <strong>{current.authorName}</strong>
              </span>

              {current.actionUrl && (
                <a
                  href={current.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-brass !py-1 !px-3 !text-[0.72rem] font-semibold inline-flex items-center gap-1"
                >
                  {current.actionLabel || "View Details"} <ExternalLink size={11} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
