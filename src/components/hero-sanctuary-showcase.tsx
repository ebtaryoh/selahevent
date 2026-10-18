"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Bus,
  BedDouble,
  Utensils,
  MapPin,
  Calendar,
  ShieldCheck,
  Zap,
  ArrowRight,
  Radio,
  Lock,
} from "lucide-react";
import Link from "next/link";

export function HeroSanctuaryShowcase() {
  const [scanned, setScanned] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "logistics" | "prayer">("pass");

  const triggerScan = () => {
    setScanned(true);
    setTimeout(() => {
      setScanned(false);
    }, 3800);
  };

  return (
    <div className="relative mx-auto mt-12 w-full max-w-4xl px-2 sm:px-4">
      {/* Ambient Celestial Glow Behind Showcase Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-r from-brass/20 via-amber-500/15 to-emerald-600/15 blur-[90px] rounded-full pointer-events-none -z-10" />

      {/* Main Showcase Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)]/90 backdrop-blur-2xl shadow-[0_30px_90px_-20px_rgba(14,42,34,0.18)] dark:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.8)] transition-all duration-300">
        {/* Top Gold Foil Hairline */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brass to-transparent opacity-80" />

        {/* Mini Tab Switcher / Navigation Pill */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--card-border)] px-6 py-4 bg-brass/[0.03]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-brass-deep dark:text-brass-light">
              Selah Operating System · Live Preview
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-paper/60 p-1 backdrop-blur-md">
            {[
              { id: "pass", label: "Turnstile Gate Pass", icon: QrCode },
              { id: "logistics", label: "Camp Logistics", icon: BedDouble },
              { id: "prayer", label: "Sanctuary Altars", icon: Sparkles },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-brass text-black shadow-sm"
                    : "text-warm-600 dark:text-warm-400 hover:text-ink"
                }`}
              >
                <tab.icon size={12} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab 1: The Turnstile Gate Pass Showcase */}
        {activeTab === "pass" && (
          <div className="p-6 sm:p-8">
            <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-700 dark:text-emerald-400">
                    ● GATE READY
                  </span>
                  <span className="rounded-full bg-brass/15 border border-brass/30 px-2.5 py-0.5 text-[0.68rem] font-bold text-brass-deep dark:text-brass-light">
                    VIP DELEGATE
                  </span>
                  <span className="text-xs text-warm-500 font-medium">
                    #SLH-2026-8582
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                  SOAR MFM Youth Conference 2026
                </h3>
                <p className="font-serif italic text-brass-deep dark:text-brass-light mt-1 text-sm sm:text-base">
                  &ldquo;Power From On High&rdquo; · Prayer City Multipurpose Auditorium
                </p>

                {/* Seat, Dorm & Bus Chips */}
                <div className="mt-5 grid grid-cols-3 gap-2.5 border-y border-[var(--card-border)] py-4">
                  <div className="rounded-xl border border-[var(--card-border)] bg-paper/50 p-2.5 text-center">
                    <span className="block text-[0.58rem] font-bold uppercase tracking-wider text-warm-500">Hall Seating</span>
                    <strong className="block text-sm font-bold text-ink mt-0.5">Row 4 · B-18</strong>
                  </div>
                  <div className="rounded-xl border border-[var(--card-border)] bg-paper/50 p-2.5 text-center">
                    <span className="block text-[0.58rem] font-bold uppercase tracking-wider text-warm-500">Camp Dorm</span>
                    <strong className="block text-sm font-bold text-ink mt-0.5">Block 3 · Bed 12</strong>
                  </div>
                  <div className="rounded-xl border border-[var(--card-border)] bg-paper/50 p-2.5 text-center">
                    <span className="block text-[0.58rem] font-bold uppercase tracking-wider text-warm-500">Meal Pass</span>
                    <strong className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">3-a-Day Active</strong>
                  </div>
                </div>

                {/* Micro Action Bar */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={triggerScan}
                    className="inline-flex items-center gap-2 rounded-xl bg-ink text-parchment hover:bg-ink/90 px-4 py-2 text-xs font-semibold shadow-md transition-all active:scale-[0.98]"
                  >
                    <Zap size={14} className="text-brass" />
                    <span>Simulate Gate Turnstile Scan</span>
                  </button>

                  <a
                    href="https://wa.me/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba5a] px-4 py-2 text-xs font-semibold shadow-sm transition-all"
                  >
                    <MessageSquare size={14} />
                    <span>1-Tap WhatsApp Save</span>
                  </a>
                </div>
              </div>

              {/* QR Turnstile Pass Visual Card */}
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-gradient-to-b from-paper to-paper/60 p-6 text-center shadow-lg">
                <AnimatePresence mode="wait">
                  {scanned ? (
                    <motion.div
                      key="scanned"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="py-6 flex flex-col items-center justify-center"
                    >
                      <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 ring-8 ring-emerald-500/10">
                        <CheckCircle2 size={36} strokeWidth={2.4} />
                      </div>
                      <h4 className="font-display text-lg font-bold text-ink">Turnstile Unlocked</h4>
                      <p className="text-xs text-warm-600 mt-1 max-w-[200px]">
                        Welcome, Pastor David! Verified offline in 42ms.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="qr"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative rounded-xl border border-brass/35 bg-white p-3.5 shadow-md">
                        <QrCode size={130} className="text-black" />
                        <div className="absolute inset-0 border-2 border-brass/50 rounded-xl pointer-events-none animate-pulse" />
                      </div>
                      <span className="font-mono text-[0.68rem] font-bold text-warm-600 mt-3 tracking-widest">
                        SELAH·GATE·PASS·8582
                      </span>
                      <span className="mt-1 text-[0.62rem] text-warm-500">
                        Works 100% Offline via Edge Cache Pack
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Camp Logistics Showcase */}
        {activeTab === "logistics" && (
          <div className="p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--card-border)] bg-paper/60 p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <BedDouble size={20} />
                </div>
                <h4 className="font-display text-base font-bold text-ink">Dorm Allocations</h4>
                <p className="text-xs text-warm-600 mt-1">
                  Separate Male, Female & Ministers guest rooms with live bed capacity guards.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--card-border)] text-[0.72rem] text-warm-500 font-semibold">
                  ✓ Zero dormitory overbooking
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] bg-paper/60 p-5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <Bus size={20} />
                </div>
                <h4 className="font-display text-base font-bold text-ink">Bus Shuttles</h4>
                <p className="text-xs text-warm-600 mt-1">
                  Terminal pickup routing, seat quotas, and direct WhatsApp links to bus captains.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--card-border)] text-[0.72rem] text-warm-500 font-semibold">
                  ✓ Instant passenger manifests
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--card-border)] bg-paper/60 p-5">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                  <Utensils size={20} />
                </div>
                <h4 className="font-display text-base font-bold text-ink">QR Meal Vouchers</h4>
                <p className="text-xs text-warm-600 mt-1">
                  Breakfast, lunch, and fast-breaking meal passes verified by cafeteria ushers.
                </p>
                <div className="mt-4 pt-3 border-t border-[var(--card-border)] text-[0.72rem] text-warm-500 font-semibold">
                  ✓ Eliminates meal double-claims
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Sanctuary & Prayer Showcase */}
        {activeTab === "prayer" && (
          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-brass/30 bg-brass/[0.06] p-6 text-center">
              <Sparkles size={28} className="mx-auto text-brass mb-3 animate-pulse" />
              <h4 className="font-display text-xl font-bold text-ink">
                Continuous Spiritual Fellowship Beyond the Gathering
              </h4>
              <p className="text-xs sm:text-sm text-warm-600 mt-2 max-w-lg mx-auto leading-relaxed">
                Attendees connect before and after event dates on the Community Prayer Wall, listen to peaceful soaking worship, and download daily lockscreen scriptures.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link
                  href="/sanctuary"
                  className="inline-flex items-center gap-2 rounded-full bg-brass text-black px-5 py-2 text-xs font-bold shadow-sm hover:shadow-md transition-all"
                >
                  Visit Digital Sanctuary
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Proof Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[var(--card-border)] border-t border-[var(--card-border)] bg-brass/[0.02] text-center text-[0.72rem] font-semibold text-warm-600 dark:text-warm-400">
          <div className="p-3 flex items-center justify-center gap-1.5">
            <Zap size={13} className="text-brass" />
            <span>&lt; 50ms Offline Gates</span>
          </div>
          <div className="p-3 flex items-center justify-center gap-1.5">
            <MessageSquare size={13} className="text-emerald-500" />
            <span>1-Tap WhatsApp Passes</span>
          </div>
          <div className="p-3 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-brass" />
            <span>100% Free for Free Events</span>
          </div>
          <div className="p-3 flex items-center justify-center gap-1.5">
            <Lock size={13} className="text-brass" />
            <span>Zero Password Fatigue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
