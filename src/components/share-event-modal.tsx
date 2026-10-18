"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Share2,
  X,
  Copy,
  Check,
  Mail,
  Calendar,
  MapPin,
  Building2,
  QrCode,
  Download,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Smartphone,
  Layers,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  WhatsAppIcon,
  XIcon,
  FacebookIcon,
  TelegramIcon,
  LinkedInIcon,
} from "@/components/social-icons";
import { cn } from "@/lib/format";

export interface ShareEventData {
  title: string;
  slug: string;
  description?: string | null;
  tagline?: string | null;
  theme?: string | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  venueName?: string | null;
  venueAddress?: string | null;
  city?: string | null;
  organizationName?: string | null;
  coverImage?: string | null;
  customUrl?: string;
  attendeeName?: string;
}

interface ShareEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShareEventData;
}

export function ShareEventModal({ isOpen, onClose, event }: ShareEventModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "message" | "qr">("quick");
  const modalRef = useRef<HTMLDivElement>(null);

  // Compute absolute event URL
  const origin = typeof window !== "undefined" ? window.location.origin : "https://selahevent.vercel.app";
  const eventUrl = event.customUrl || `${origin}/e/${event.slug}`;

  // Formatted date string
  const formattedDate = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Upcoming Gathering";

  const venueDisplay = [event.venueName, event.city].filter(Boolean).join(", ") || "Virtual / Sanctuary";
  const hostDisplay = event.organizationName || "Selah Church Gathering";

  // Pre-composed WhatsApp message
  const whatsAppMessage = [
    `✝️ *You are invited to ${event.title}*`,
    event.theme ? `📖 *Theme:* "${event.theme}"` : null,
    `📅 *Date:* ${formattedDate}`,
    `📍 *Venue:* ${venueDisplay}`,
    `🏛️ *Host:* ${hostDisplay}`,
    event.tagline ? `\n"${event.tagline}"` : null,
    `\nReserve your pass or view event details:`,
    `👉 ${eventUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  // Pre-composed Email
  const emailSubject = `Invitation: ${event.title}`;
  const emailBody = `Grace and peace,

You are warmly invited to attend:
${event.title}
${event.theme ? `Theme: "${event.theme}"\n` : ""}
Date & Time: ${formattedDate}
Location: ${venueDisplay}
Host: ${hostDisplay}
${event.tagline ? `\n"${event.tagline}"\n` : ""}
Reserve your digital seat and access gate check-in pass online:
${eventUrl}

Looking forward to gathering together!`;

  // Pre-composed full church bulletin announcement message
  const fullAnnouncementMessage = [
    `🕊️ *SPECIAL INVITATION*`,
    `*${event.title}*`,
    event.theme ? `*Theme:* "${event.theme}"` : null,
    ``,
    `📅 *When:* ${formattedDate}`,
    `📍 *Where:* ${venueDisplay}${event.venueAddress ? ` (${event.venueAddress})` : ""}`,
    `🏛️ *Organised by:* ${hostDisplay}`,
    event.description ? `\n${event.description.slice(0, 220)}...` : null,
    ``,
    `🎟️ *Register your pass online (Fast, 1-Click QR Badge):*`,
    `👉 ${eventUrl}`,
    ``,
    `_Please share with family, brethren, and fellowship groups!_`,
  ]
    .filter(Boolean)
    .join("\n");

  // Pre-composed X (Twitter) text
  const xText = `Join us for ${event.title}! Register your digital pass here:`;

  // Pre-composed Telegram text
  const telegramText = `You are invited to ${event.title} on ${formattedDate}. Register here:`;

  // Check if navigator.share is available
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

  // Keyboard navigation (Esc to close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Actions
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(eventUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    });
  };

  const handleCopyText = () => {
    navigator.clipboard?.writeText(fullAnnouncementMessage).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2400);
    });
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppMessage)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleEmailShare = () => {
    const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailto;
  };

  const handleXShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(xText)}&url=${encodeURIComponent(eventUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(telegramText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `You're invited to ${event.title}!`,
          url: eventUrl,
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.warn("[share] Native share failed:", err);
        }
      }
    }
  };

  const handleDownloadQr = () => {
    setDownloadingQr(true);
    try {
      const svg = document.getElementById("selah-share-qr-svg");
      if (!svg) throw new Error("QR SVG not found");

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // High resolution 1000x1000 QR image
        canvas.width = 1000;
        canvas.height = 1000;

        if (ctx) {
          // White background padding
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 1000, 1000);
          ctx.drawImage(img, 100, 100, 800, 800);

          // Selah Event watermark footer
          ctx.fillStyle = "#161311";
          ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(event.title.slice(0, 40), 500, 940);
          ctx.fillStyle = "#8a7b68";
          ctx.font = "20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
          ctx.fillText("Scan to Register · Selah Events", 500, 970);

          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `${event.slug}-qr-code.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
        setDownloadingQr(false);
      };

      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch (e) {
      console.error("QR download error:", e);
      setDownloadingQr(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-event-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-[rgba(226,192,115,0.22)] bg-card-bg text-ink shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
      >
        {/* Subtle top gold decorative line */}
        <div className="h-1 w-full bg-gradient-to-r from-brass/30 via-brass to-brass/30" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[var(--card-border)] bg-paper/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(226,192,115,0.15)] text-brass">
                <Share2 size={15} />
              </span>
              <span className="text-[0.68rem] font-bold tracking-wider uppercase text-brass">
                Invite &amp; Broadcast
              </span>
            </div>
            <h2 id="share-event-title" className="font-display text-xl sm:text-2xl font-semibold text-ink mt-1">
              Share this Gathering
            </h2>
            <p className="text-xs sm:text-sm text-warm-600 mt-0.5">
              Invite your church family, colleagues, and brethren across any channel.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-warm-500 hover:text-ink hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Event Preview Badge Card */}
        <div className="px-5 sm:px-6 pt-5 pb-3">
          <div className="relative rounded-2xl border border-[var(--card-border)] bg-paper/60 p-4 shadow-sm overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {event.theme && (
                <div className="text-[0.68rem] font-semibold text-brass truncate mb-0.5">
                  “{event.theme}”
                </div>
              )}
              <h3 className="font-display text-base sm:text-lg font-semibold text-ink truncate">
                {event.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-warm-600">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={12} className="text-brass shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} className="text-brass shrink-0" />
                  <span className="truncate">{venueDisplay}</span>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex shrink-0 items-center justify-center h-14 w-14 rounded-xl border border-brass/25 bg-brass/10 text-brass">
              <QrCode size={28} />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-2">
          <div className="flex items-center border-b border-[var(--card-border)] text-xs font-semibold text-warm-500 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={cn(
                "pb-2.5 transition-colors relative",
                activeTab === "quick"
                  ? "text-brass font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brass"
                  : "hover:text-ink"
              )}
            >
              1-Click Share
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("message")}
              className={cn(
                "pb-2.5 transition-colors relative",
                activeTab === "message"
                  ? "text-brass font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brass"
                  : "hover:text-ink"
              )}
            >
              Church Group Announcement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={cn(
                "pb-2.5 transition-colors relative",
                activeTab === "qr"
                  ? "text-brass font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brass"
                  : "hover:text-ink"
              )}
            >
              Projection &amp; Print QR
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
          {activeTab === "quick" && (
            <div className="space-y-4">
              {/* Channel Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* 1. WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-ink">WhatsApp</span>
                  <span className="text-[0.65rem] text-emerald-500/90 mt-0.5">Chat &amp; Status</span>
                </button>

                {/* 2. Email */}
                <button
                  type="button"
                  onClick={handleEmailShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <Mail size={18} />
                  </span>
                  <span className="text-xs font-semibold text-ink">Email Invite</span>
                  <span className="text-[0.65rem] text-indigo-400/90 mt-0.5">Pre-filled Details</span>
                </button>

                {/* 3. X (Twitter) */}
                <button
                  type="button"
                  onClick={handleXShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-ink transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white border border-white/20 mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <XIcon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-ink">X (Twitter)</span>
                  <span className="text-[0.65rem] text-warm-500 mt-0.5">Post to Feed</span>
                </button>

                {/* 4. Telegram */}
                <button
                  type="button"
                  onClick={handleTelegramShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-sky-500/25 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <TelegramIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-ink">Telegram</span>
                  <span className="text-[0.65rem] text-sky-400/90 mt-0.5">Direct &amp; Channels</span>
                </button>

                {/* 5. Facebook */}
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white mb-2 shadow-sm group-hover:scale-105 transition-transform">
                    <FacebookIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold text-ink">Facebook</span>
                  <span className="text-[0.65rem] text-blue-400/90 mt-0.5">Story or Wall</span>
                </button>

                {/* 6. LinkedIn or Native Device Share */}
                {canNativeShare ? (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-brass/30 bg-brass/10 hover:bg-brass/20 text-brass transition-all text-center group shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brass text-ink mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <Smartphone size={18} />
                    </span>
                    <span className="text-xs font-semibold text-ink">Device Share</span>
                    <span className="text-[0.65rem] text-brass/90 mt-0.5">AirDrop, Apps, SMS</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLinkedInShare}
                    className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-[#0A66C2]/25 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] transition-all text-center group shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white mb-2 shadow-sm group-hover:scale-105 transition-transform">
                      <LinkedInIcon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-ink">LinkedIn</span>
                    <span className="text-[0.65rem] text-[#0A66C2]/90 mt-0.5">Ministry Network</span>
                  </button>
                )}
              </div>

              {/* Direct Link Copy Box */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                  Direct Registration Link
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-[var(--card-border)] bg-input-bg focus-within:border-brass transition-colors">
                  <div className="flex-1 min-w-0 px-2.5 text-xs text-ink truncate font-mono select-all">
                    {eventUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "btn !py-2 !px-3.5 !text-xs shrink-0 transition-all font-semibold",
                      copiedLink
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "btn-brass"
                    )}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} className="text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "message" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-warm-600">
                  Ready-to-paste announcement formatted for church bulletins, WhatsApp broadcast lists, and cell groups.
                </p>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ml-2",
                    copiedText
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-brass/15 text-brass border border-brass/30 hover:bg-brass/25"
                  )}
                >
                  {copiedText ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Copied Announcement!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Full Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-2xl border border-[var(--card-border)] bg-input-bg p-3.5 font-sans text-xs text-ink leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto">
                {fullAnnouncementMessage}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="btn !py-2 !px-3 !text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Send directly via WhatsApp
                </button>
              </div>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-warm-600 max-w-sm mx-auto">
                Scan with any smartphone camera to open registration immediately. High resolution for slide projections and church bulletins.
              </p>

              <div className="inline-flex p-4 rounded-2xl bg-white border border-brass/30 shadow-md">
                <QRCodeSVG
                  id="selah-share-qr-svg"
                  value={eventUrl}
                  size={190}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0e2a22"
                  includeMargin={false}
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={downloadingQr}
                  className="btn btn-brass !py-2.5 !px-5 !text-xs inline-flex items-center gap-2"
                >
                  <Download size={14} />
                  <span>{downloadingQr ? "Preparing..." : "Download QR Code (PNG)"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-light !py-2.5 !px-4 !text-xs"
                >
                  <Copy size={14} /> Copy Event Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--card-border)] bg-paper/30 flex items-center justify-between text-xs text-warm-500">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-brass" /> Selah Christian Event Sharing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-warm-600 hover:text-ink transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable Drop-in Share Button
 */
interface ShareEventButtonProps {
  event: ShareEventData;
  className?: string;
  variant?: "light" | "brass" | "ghost" | "secondary" | "custom";
  size?: "sm" | "md" | "lg";
  label?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function ShareEventButton({
  event,
  className,
  variant = "light",
  size = "md",
  label = "Share event",
  showIcon = true,
  children,
}: ShareEventButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const variantClass = {
    light: "btn btn-light",
    brass: "btn btn-brass",
    secondary: "btn btn-secondary",
    ghost: "btn btn-ghost",
    custom: "",
  }[variant];

  const sizeClass = {
    sm: "!px-3 !py-1.5 !text-xs",
    md: "!px-4 !py-2.5 !text-[0.78rem]",
    lg: "!px-6 !py-3.5 !text-sm",
  }[size];

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={cn(variantClass, sizeClass, className)}
        title={`Share ${event.title}`}
      >
        {children ? (
          children
        ) : (
          <>
            {showIcon && <Share2 size={size === "sm" ? 13 : 15} />}
            <span>{label}</span>
          </>
        )}
      </button>

      {isOpen && (
        <ShareEventModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          event={event}
        />
      )}
    </>
  );
}
