"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Bell, Check, Users, Calendar, ArrowRight, Sparkles, MessageSquare, X, Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Ministry = {
  id: string;
  name: string;
  denomination: string;
  city: string;
  followersCount: number;
  latestBulletin: {
    title: string;
    date: string;
    pastorWord: string;
    scripture: string;
  };
  upcomingEventSlug?: string;
  upcomingEventTitle?: string;
};

const MINISTRIES: Ministry[] = [
  {
    id: "mfm-youth",
    name: "MFM Youth Fellowship",
    denomination: "Mountain of Fire & Miracles Ministries",
    city: "Lagos",
    followersCount: 14200,
    latestBulletin: {
      title: "This Week: Walking in Supernatural Authority",
      date: "October 2026",
      pastorWord: "Beloved youth, do not let worldly culture define your standards. As we prepare for the SOAR conference, dedicate 15 minutes of tongues daily before noon.",
      scripture: "Luke 10:19 — Behold, I give unto you power to tread on serpents and scorpions.",
    },
    upcomingEventSlug: "mfm-youth-soar-conference-2026-9558",
    upcomingEventTitle: "MFM YOUTH SOAR CONFERENCE 2026",
  },
  {
    id: "come-alive",
    name: "Come Alive Youth Programme",
    denomination: "Inter-denominational Campus Fellowship",
    city: "Ibadan",
    followersCount: 8900,
    latestBulletin: {
      title: "Praise Night & Holy Ghost Outpouring",
      date: "October 2026",
      pastorWord: "God is raising a generation of unashamed worshipers in the universities. Let our worship be pure and unfiltered this season.",
      scripture: "Psalm 150:6 — Let everything that hath breath praise the Lord.",
    },
    upcomingEventSlug: "come-alive-youth-programme-1490",
    upcomingEventTitle: "Come Alive Youth Programme",
  },
  {
    id: "grace-city",
    name: "Grace City Assembly",
    denomination: "Bible Church",
    city: "Abuja",
    followersCount: 5400,
    latestBulletin: {
      title: "Faith in the Marketplace",
      date: "October 2026",
      pastorWord: "Your office, business, and campus are your primary mission field. Shine the light of Christ through integrity and uncompromised excellence.",
      scripture: "Matthew 5:16 — Let your light so shine before men.",
    },
  },
];

export function MinistryChannelsFeed() {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set(["mfm-youth"]));
  const [activeMinistryToSubscribe, setActiveMinistryToSubscribe] = useState<Ministry | null>(null);
  const [contactInput, setContactInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("selah_followed_ministries");
    if (saved) {
      try {
        setFollowedIds(new Set(JSON.parse(saved)));
      } catch {}
    }
  }, []);

  const toggleFollow = (ministry: Ministry) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      const isCurrentlyFollowed = next.has(ministry.id);

      if (isCurrentlyFollowed) {
        next.delete(ministry.id);
      } else {
        next.add(ministry.id);
        // Prompt for optional email/WhatsApp subscription if following for first time
        setActiveMinistryToSubscribe(ministry);
        setSubscribeSuccess(false);
        setErrorMessage(null);
      }

      localStorage.setItem("selah_followed_ministries", JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMinistryToSubscribe || !contactInput.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const isEmail = contactInput.includes("@");
    const payload = {
      ministryId: activeMinistryToSubscribe.id,
      ministryName: activeMinistryToSubscribe.name,
      email: isEmail ? contactInput.trim() : null,
      phone: !isEmail ? contactInput.trim() : null,
    };

    try {
      const res = await fetch("/api/ministries/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Unable to save contact. Please try again.");
        return;
      }

      setSubscribeSuccess(true);
      setTimeout(() => {
        setActiveMinistryToSubscribe(null);
        setContactInput("");
      }, 1800);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-brass" />
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-ink">
              Ministry Channels · Follow Your Home Church
            </h3>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-warm-500 max-w-xl">
            Stay plugged into weekly spiritual bulletins, pastoral words, and priority event passes from your home church.
          </p>
        </div>

        <span className="text-xs text-warm-500">
          Following {followedIds.size} {followedIds.size === 1 ? "Ministry" : "Ministries"}
        </span>
      </div>

      {/* Ministry Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MINISTRIES.map((m) => {
          const isFollowed = followedIds.has(m.id);
          return (
            <div
              key={m.id}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between transition-all",
                isFollowed
                  ? "border-brass/35 bg-gradient-to-b from-brass/5 to-paper shadow-md"
                  : "border-white/10 bg-paper hover:border-white/20"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-ink text-sm sm:text-base leading-tight">
                      {m.name}
                    </h4>
                    <div className="text-[0.68rem] text-warm-500 mt-0.5">
                      {m.denomination} · {m.city}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleFollow(m)}
                    className={cn(
                      "btn !py-1 !px-2.5 !text-xs font-semibold cursor-pointer transition-colors",
                      isFollowed
                        ? "bg-brass/20 text-brass border border-brass/40"
                        : "btn-secondary text-warm-400 hover:text-ink"
                    )}
                  >
                    {isFollowed ? (
                      <>
                        <Check size={12} /> Following
                      </>
                    ) : (
                      <>
                        <Bell size={12} /> Follow
                      </>
                    )}
                  </button>
                </div>

                {/* Pastor's Charge / Weekly Bulletin */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[0.68rem]">
                    <span className="font-bold text-brass uppercase tracking-wider">
                      Weekly Bulletin Focus
                    </span>
                    <span className="text-warm-500">{m.latestBulletin.date}</span>
                  </div>

                  <h5 className="font-semibold text-xs text-ink">
                    {m.latestBulletin.title}
                  </h5>

                  <p className="text-xs text-warm-500 leading-relaxed italic line-clamp-3">
                    &ldquo;{m.latestBulletin.pastorWord}&rdquo;
                  </p>

                  <div className="text-[0.68rem] font-semibold text-brass-light pt-1 border-t border-white/5">
                    {m.latestBulletin.scripture}
                  </div>
                </div>

                {/* Upcoming Event Link if available */}
                {m.upcomingEventSlug && (
                  <Link
                    href={`/e/${m.upcomingEventSlug}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-brass/25 bg-brass/10 text-xs text-ink hover:bg-brass/15 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar size={13} className="text-brass shrink-0" />
                      <span className="truncate font-medium">{m.upcomingEventTitle}</span>
                    </div>
                    <ArrowRight size={13} className="text-brass shrink-0" />
                  </Link>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[0.72rem] text-warm-500">
                <span className="flex items-center gap-1">
                  <Users size={12} /> {m.followersCount.toLocaleString()} believers connected
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 1-Step Subscribe by Email / WhatsApp Modal */}
      {activeMinistryToSubscribe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-brass/30 bg-[#121417] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brass" />
                <h4 className="font-semibold text-ink text-sm">
                  Connected with {activeMinistryToSubscribe.name}!
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveMinistryToSubscribe(null)}
                className="text-warm-500 hover:text-ink cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            {subscribeSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center space-y-1.5">
                <Check size={24} className="mx-auto text-emerald-400" />
                <h5 className="font-semibold text-ink text-sm">Subscription Confirmed!</h5>
                <p className="text-xs text-warm-500">
                  You will now receive weekly pastoral devotionals and priority event alerts.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribeSubmit} className="space-y-3.5">
                <p className="text-xs text-warm-400 leading-relaxed">
                  Enter your email or WhatsApp number to receive Pastor&apos;s weekly charge and event passes directly. No account or password needed!
                </p>

                {errorMessage && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-[0.72rem] font-semibold text-warm-400 mb-1">
                    Email Address or WhatsApp Number
                  </label>
                  <input
                    className="input text-xs"
                    required
                    value={contactInput}
                    onChange={(e) => setContactInput(e.target.value)}
                    placeholder="you@example.com or +234 801 234 5678"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveMinistryToSubscribe(null)}
                    className="px-3 py-1.5 text-xs text-warm-500 hover:text-warm-300"
                  >
                    Keep on device only
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-brass !py-2 !px-4 !text-xs font-semibold cursor-pointer shadow-sm shadow-brass/20 flex items-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={13} /> Stay Connected
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
