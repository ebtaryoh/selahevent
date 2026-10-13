"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Plus,
  Sparkles,
  Check,
  Loader2,
  Filter,
  X,
  MessageCircle,
  ShieldCheck,
  Send,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/format";

type PrayerItem = {
  id: string;
  authorName: string;
  authorCity: string;
  title: string;
  content: string;
  category: string;
  prayerCount: number;
  isTestimony: boolean;
  testimonyUpdate: string | null;
  createdAt: string;
};

const CATEGORIES = [
  { id: "all", label: "All Categories" },
  { id: "healing", label: "Healing & Health" },
  { id: "family", label: "Family & Marriage" },
  { id: "career", label: "Career & Exams" },
  { id: "spiritual", label: "Spiritual Breakthrough" },
  { id: "ministry", label: "Churches & Missions" },
];

export function PrayerWall() {
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "requests" | "testimonies">("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [prayedIds, setPrayedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    authorName: "",
    authorCity: "Lagos",
    isAnonymous: false,
    category: "spiritual",
    isTestimony: false,
    testimonyUpdate: "",
  });

  const fetchPrayers = async () => {
    try {
      const url = new URL("/api/prayer-requests", window.location.origin);
      if (selectedCategory !== "all") url.searchParams.set("category", selectedCategory);
      if (activeFilter !== "all") url.searchParams.set("filter", activeFilter);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.ok && Array.isArray(data.prayers)) {
        setPrayers(data.prayers);
      }
    } catch (e) {
      console.error("Error fetching prayers:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayers();
  }, [activeFilter, selectedCategory]);

  const handlePray = async (id: string) => {
    if (prayedIds.has(id)) return;

    // Optimistic update
    setPrayedIds((prev) => new Set(prev).add(id));
    setPrayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, prayerCount: p.prayerCount + 1 } : p))
    );

    try {
      await fetch(`/api/prayer-requests/${id}/pray`, { method: "POST" });
    } catch (e) {
      console.error("Failed to record prayer:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        authorName: formData.isAnonymous ? "Anonymous Believer" : (formData.authorName || "Believer"),
        authorCity: formData.authorCity || "Lagos",
        category: formData.category,
        isTestimony: formData.isTestimony,
        testimonyUpdate: formData.isTestimony ? formData.testimonyUpdate : undefined,
      };

      const res = await fetch("/api/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setFormError(data.error || "Unable to submit prayer. Please try again.");
        return;
      }

      setFormSuccess(true);
      if (data.prayer) {
        setPrayers((prev) => [data.prayer, ...prev]);
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(false);
        setFormData({
          title: "",
          content: "",
          authorName: "",
          authorCity: "Lagos",
          isAnonymous: false,
          category: "spiritual",
          isTestimony: false,
          testimonyUpdate: "",
        });
      }, 1500);
    } catch {
      setFormError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wall Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink">
            Community Prayer Wall & Intercession
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-warm-500 max-w-xl">
            &ldquo;Bear one another&apos;s burdens, and so fulfill the law of Christ.&rdquo; (Galatians 6:2).
            Stand in agreement with brothers and sisters worldwide.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-brass !py-2.5 !px-5 !text-xs sm:!text-sm font-semibold cursor-pointer shadow-lg shadow-brass/20 shrink-0"
        >
          <Plus size={16} /> Post Prayer or Praise Report
        </button>
      </div>

      {/* Filter Tabs & Category Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Main Tabs */}
        <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors cursor-pointer",
              activeFilter === "all" ? "bg-brass text-black" : "text-warm-400 hover:text-ink"
            )}
          >
            All Posts ({prayers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("requests")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors cursor-pointer",
              activeFilter === "requests" ? "bg-brass text-black" : "text-warm-400 hover:text-ink"
            )}
          >
            Needs Prayer
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("testimonies")}
            className={cn(
              "rounded-lg px-3 py-1.5 transition-colors cursor-pointer flex items-center gap-1",
              activeFilter === "testimonies" ? "bg-brass text-black" : "text-warm-400 hover:text-ink"
            )}
          >
            <Sparkles size={13} /> Praise Reports
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-[0.7rem] font-semibold transition-colors cursor-pointer",
                selectedCategory === c.id
                  ? "border-brass/40 bg-brass/15 text-brass"
                  : "border-white/10 bg-white/[0.02] text-warm-500 hover:border-white/20 hover:text-warm-300"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prayers Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-warm-500 space-y-3">
          <Loader2 size={24} className="animate-spin text-brass" />
          <p className="text-xs">Gathering prayers and testimonies...</p>
        </div>
      ) : prayers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-paper p-12 text-center space-y-4">
          <Heart size={32} className="mx-auto text-warm-500" />
          <h3 className="font-semibold text-ink text-base">No requests under this filter</h3>
          <p className="text-xs text-warm-500 max-w-sm mx-auto">
            Be the first to share a prayer need or testify of God&apos;s goodness in this category.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-secondary !py-2 !px-4 !text-xs cursor-pointer"
          >
            Share a Request Now
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {prayers.map((item) => {
            const hasPrayed = prayedIds.has(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border p-6 transition-all",
                  item.isTestimony
                    ? "border-[rgba(192,138,46,0.35)] bg-gradient-to-br from-[rgba(192,138,46,0.08)] to-paper shadow-md"
                    : "border-white/10 bg-paper hover:border-white/20"
                )}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-warm-300">
                        {item.authorName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-ink">
                          {item.authorName}
                        </div>
                        <div className="text-[0.68rem] text-warm-500">
                          {item.authorCity || "Global"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.isTestimony && (
                        <span className="rounded-full bg-brass/20 border border-brass/40 px-2 py-0.5 text-[0.65rem] font-bold text-brass flex items-center gap-1">
                          <Sparkles size={11} /> Answered Prayer
                        </span>
                      )}
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium text-warm-400 capitalize">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-ink text-sm sm:text-base leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-warm-600 whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>

                  {item.testimonyUpdate && (
                    <div className="rounded-xl border border-brass/30 bg-brass/10 p-3 text-xs space-y-1">
                      <div className="font-bold text-brass flex items-center gap-1">
                        <Sparkles size={12} /> Praise Report Update:
                      </div>
                      <p className="text-ink leading-relaxed italic">
                        &ldquo;{item.testimonyUpdate}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[0.72rem] text-warm-500">
                    {item.prayerCount} {item.prayerCount === 1 ? "believer" : "believers"} standing in agreement
                  </span>

                  <button
                    type="button"
                    onClick={() => handlePray(item.id)}
                    disabled={hasPrayed}
                    className={cn(
                      "btn !py-1.5 !px-3 !text-xs font-semibold cursor-pointer transition-all",
                      hasPrayed
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "btn-secondary hover:border-brass/40 hover:text-brass"
                    )}
                  >
                    {hasPrayed ? (
                      <>
                        <Check size={13} className="text-emerald-400" /> Prayed
                      </>
                    ) : (
                      <>
                        🙏 I Prayed For You
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Prayer Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#121316] p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {formData.isTestimony ? "Share a Praise Report" : "Submit a Prayer Request"}
                </h3>
                <p className="text-xs text-warm-500">
                  Join hands with faithful believers standing in agreement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-warm-500 hover:text-ink cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {formSuccess ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2">
                <Check size={28} className="mx-auto text-emerald-400" />
                <h4 className="font-semibold text-ink text-sm">Prayer Posted to Sanctuary</h4>
                <p className="text-xs text-warm-500">
                  Believers around the world will now hold hands with you in faith.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    {formError}
                  </div>
                )}

                {/* Praise Report Toggle */}
                <div className="rounded-xl border border-brass/30 bg-brass/10 p-3">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.isTestimony}
                      onChange={(e) => setFormData({ ...formData, isTestimony: e.target.checked })}
                    />
                    <div className="text-xs">
                      <span className="font-bold text-brass block">
                        Is this a Praise Report / Answered Prayer?
                      </span>
                      <span className="text-warm-400 block text-[0.7rem]">
                        Check this if God has already done it and you are giving Him praise!
                      </span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-400 mb-1">
                    Title of Request or Praise *
                  </label>
                  <input
                    className="input"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Total healing for my sister in hospital"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-400 mb-1">
                    What are we trusting God for? *
                  </label>
                  <textarea
                    className="input min-h-[90px]"
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Share what is on your heart so we can pray with understanding..."
                  />
                </div>

                {formData.isTestimony && (
                  <div>
                    <label className="block text-xs font-semibold text-brass mb-1">
                      God&apos;s Miraculous Intervention (Testimony Details)
                    </label>
                    <textarea
                      className="input min-h-[70px] border-brass/40"
                      value={formData.testimonyUpdate}
                      onChange={(e) => setFormData({ ...formData, testimonyUpdate: e.target.value })}
                      placeholder="Explain how God stepped in and answered..."
                    />
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-warm-400 mb-1">
                      Category
                    </label>
                    <select
                      className="input text-xs"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="healing">Healing & Health</option>
                      <option value="family">Family & Marriage</option>
                      <option value="career">Career & Exams</option>
                      <option value="spiritual">Spiritual Breakthrough</option>
                      <option value="ministry">Churches & Missions</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-warm-400 mb-1">
                      Your City
                    </label>
                    <input
                      className="input text-xs"
                      value={formData.authorCity}
                      onChange={(e) => setFormData({ ...formData, authorCity: e.target.value })}
                      placeholder="e.g. Lagos, Abuja, London"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-400 mb-1">
                    Your Name
                  </label>
                  <input
                    className="input text-xs"
                    disabled={formData.isAnonymous}
                    value={formData.authorName}
                    onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                    placeholder="e.g. Sister Mercy or Brother David"
                  />
                  <label className="mt-2 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    />
                    <span className="text-xs text-warm-500">Post as Anonymous Believer</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost !text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-brass !text-xs font-semibold cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} /> Submit to Prayer Wall
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
