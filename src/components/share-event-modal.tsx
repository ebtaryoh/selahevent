"use client";

import { useState, useEffect, useRef } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  Mail,
  Calendar,
  MapPin,
  QrCode,
  Download,
  MessageSquare,
  Sparkles,
  Smartphone,
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-event-title"
    >
      <div
        ref={modalRef}
        className={cn(
          // Mobile: bottom sheet with safe bottom padding; Desktop: centered card
          "relative w-full sm:max-w-xl max-h-[90vh] sm:max-h-[88vh]",
          "rounded-t-3xl sm:rounded-3xl",
          // 100% Solid Opaque Background in both Light and Dark modes (ZERO bleed-through)
          "bg-[#ffffff] dark:bg-[#141318]",
          "text-[#121110] dark:text-[#fdfdfd]",
          "border-t sm:border border-[#e7e1d5] dark:border-[rgba(226,192,115,0.25)]",
          "shadow-2xl flex flex-col overflow-hidden",
          "animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        )}
      >
        {/* Mobile Pull Bar / Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-[#ffffff] dark:bg-[#141318]">
          <div className="h-1.5 w-12 rounded-full bg-[#d5cdbf] dark:bg-white/20" />
        </div>

        {/* Top Gold Accent Line */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#b89745] to-transparent dark:via-[#e2c073]" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-[#ece6d9] dark:border-white/10 bg-[#faf8f4] dark:bg-[#191720]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.68rem] font-bold tracking-wider uppercase bg-[#f0e8d8] text-[#8a5e14] dark:bg-[rgba(226,192,115,0.14)] dark:text-[#e2c073]">
              <Share2 size={12} />
              <span>Invite &amp; Broadcast</span>
            </div>
            <h2 id="share-event-title" className="font-display text-xl sm:text-2xl font-bold text-[#121110] dark:text-[#ffffff] mt-1.5">
              Share this Gathering
            </h2>
            <p className="text-xs sm:text-sm text-[#574f45] dark:text-[#a1a1aa] mt-0.5">
              Invite your church family, colleagues, and brethren across any channel.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#574f45] hover:text-[#121110] hover:bg-black/5 dark:text-[#a1a1aa] dark:hover:text-white dark:hover:bg-white/10 transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Event Preview Badge Card (100% Opaque Solid Card) */}
        <div className="px-5 sm:px-6 pt-4 pb-2">
          <div className="rounded-2xl border border-[#e5dfd3] dark:border-white/10 bg-[#f7f4ed] dark:bg-[#1c1a23] p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              {event.theme && (
                <div className="text-[0.68rem] font-bold uppercase tracking-wider text-[#8a5e14] dark:text-[#e2c073] truncate mb-0.5">
                  “{event.theme}”
                </div>
              )}
              <h3 className="font-display text-base sm:text-lg font-bold text-[#121110] dark:text-[#ffffff] truncate">
                {event.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#574f45] dark:text-[#c4c4cc]">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Calendar size={13} className="text-[#8a5e14] dark:text-[#e2c073] shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin size={13} className="text-[#8a5e14] dark:text-[#e2c073] shrink-0" />
                  <span className="truncate">{venueDisplay}</span>
                </span>
              </div>
            </div>

            <div className="hidden sm:flex shrink-0 items-center justify-center h-12 w-12 rounded-xl border border-[#e2d8c3] dark:border-white/15 bg-white dark:bg-[#25222e] text-[#8a5e14] dark:text-[#e2c073] shadow-sm">
              <QrCode size={24} />
            </div>
          </div>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="px-5 sm:px-6 pt-2">
          <div className="flex items-center p-1 rounded-xl bg-[#ede7dc] dark:bg-[#1c1a23] border border-[#e2d8c3] dark:border-white/10 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-center transition-all",
                activeTab === "quick"
                  ? "bg-white dark:bg-[#2c2838] text-[#121110] dark:text-white shadow-sm font-bold"
                  : "text-[#574f45] dark:text-[#a1a1aa] hover:text-[#121110] dark:hover:text-white"
              )}
            >
              1-Click Share
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("message")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-center transition-all",
                activeTab === "message"
                  ? "bg-white dark:bg-[#2c2838] text-[#121110] dark:text-white shadow-sm font-bold"
                  : "text-[#574f45] dark:text-[#a1a1aa] hover:text-[#121110] dark:hover:text-white"
              )}
            >
              Church Announcement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-center transition-all",
                activeTab === "qr"
                  ? "bg-white dark:bg-[#2c2838] text-[#121110] dark:text-white shadow-sm font-bold"
                  : "text-[#574f45] dark:text-[#a1a1aa] hover:text-[#121110] dark:hover:text-white"
              )}
            >
              Scan &amp; Print QR
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 bg-[#ffffff] dark:bg-[#141318]">
          {activeTab === "quick" && (
            <div className="space-y-4">
              {/* Channel Grid: 2 columns on mobile, 3 columns on tablet/desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* 1. WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-[#f0fbf4] dark:bg-[#0c2419] hover:bg-[#e4f8ec] dark:hover:bg-[#113223] transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <WhatsAppIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-[#121110] dark:text-white">WhatsApp</span>
                  <span className="text-[0.65rem] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">Chat &amp; Status</span>
                </button>

                {/* 2. Email */}
                <button
                  type="button"
                  onClick={handleEmailShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-[#f5f5ff] dark:bg-[#181836] hover:bg-[#eaeaff] dark:hover:bg-[#21214a] transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4f46e5] text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <Mail size={18} />
                  </span>
                  <span className="text-xs font-bold text-[#121110] dark:text-white">Email Invite</span>
                  <span className="text-[0.65rem] text-indigo-700 dark:text-indigo-400 font-semibold mt-0.5">Pre-filled Details</span>
                </button>

                {/* 3. X (Twitter) */}
                <button
                  type="button"
                  onClick={handleXShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-[#e0dad0] dark:border-white/10 bg-[#f8f6f2] dark:bg-[#1c1a22] hover:bg-[#efece4] dark:hover:bg-[#26242f] transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white border border-white/20 mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <XIcon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold text-[#121110] dark:text-white">X (Twitter)</span>
                  <span className="text-[0.65rem] text-[#574f45] dark:text-[#a1a1aa] font-medium mt-0.5">Post to Feed</span>
                </button>

                {/* 4. Telegram */}
                <button
                  type="button"
                  onClick={handleTelegramShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-[#f0f9ff] dark:bg-[#0c202d] hover:bg-[#e0f2fe] dark:hover:bg-[#112d40] transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <TelegramIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-[#121110] dark:text-white">Telegram</span>
                  <span className="text-[0.65rem] text-sky-700 dark:text-sky-400 font-semibold mt-0.5">Direct &amp; Channels</span>
                </button>

                {/* 5. Facebook */}
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-[#f0f6ff] dark:bg-[#0d1e38] hover:bg-[#dbeafe] dark:hover:bg-[#122b52] transition-all text-center group shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                    <FacebookIcon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-[#121110] dark:text-white">Facebook</span>
                  <span className="text-[0.65rem] text-blue-700 dark:text-blue-400 font-semibold mt-0.5">Story or Wall</span>
                </button>

                {/* 6. LinkedIn or Device Share */}
                {canNativeShare ? (
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-[#e2d8c3] dark:border-brass/30 bg-[#faf6ee] dark:bg-[#221c13] hover:bg-[#f3edd9] dark:hover:bg-[#2d251a] transition-all text-center group shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b89745] dark:bg-[#e2c073] text-white dark:text-[#121110] mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <Smartphone size={18} />
                    </span>
                    <span className="text-xs font-bold text-[#121110] dark:text-white">Device Apps</span>
                    <span className="text-[0.65rem] text-[#8a5e14] dark:text-[#e2c073] font-semibold mt-0.5">AirDrop, SMS, Apps</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLinkedInShare}
                    className="flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl border border-[#0A66C2]/25 bg-[#f0f6fc] dark:bg-[#0c1f30] hover:bg-[#e1effa] dark:hover:bg-[#122c44] transition-all text-center group shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A66C2] text-white mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                      <LinkedInIcon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-bold text-[#121110] dark:text-white">LinkedIn</span>
                    <span className="text-[0.65rem] text-[#0A66C2] font-semibold mt-0.5">Ministry Network</span>
                  </button>
                )}
              </div>

              {/* Direct Link Copy Bar (Solid Opaque Input) */}
              <div className="pt-1">
                <label className="block text-[0.7rem] font-bold text-[#574f45] dark:text-[#a1a1aa] uppercase tracking-wider mb-1.5">
                  Direct Registration Link
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-[#ded5c2] dark:border-white/15 bg-[#f5f1e8] dark:bg-[#0d0c10] shadow-inner focus-within:border-[#8a5e14] dark:focus-within:border-[#e2c073] transition-colors">
                  <div className="flex-1 min-w-0 px-2.5 text-xs text-[#121110] dark:text-white truncate font-mono select-all">
                    {eventUrl}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={cn(
                      "px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-sm",
                      copiedLink
                        ? "bg-emerald-600 text-white"
                        : "bg-[#8a5e14] hover:bg-[#734e0f] text-white dark:bg-[#e2c073] dark:hover:bg-[#fceec5] dark:text-[#121110]"
                    )}
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} className="text-white" />
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-[#574f45] dark:text-[#a1a1aa] leading-relaxed">
                  Formatted for church bulletins, WhatsApp broadcast lists, and prayer cell groups.
                </p>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 shadow-sm",
                    copiedText
                      ? "bg-emerald-600 text-white"
                      : "bg-[#f0e8d8] text-[#8a5e14] hover:bg-[#e6dcce] dark:bg-[rgba(226,192,115,0.18)] dark:text-[#e2c073] dark:hover:bg-[rgba(226,192,115,0.28)]"
                  )}
                >
                  {copiedText ? (
                    <>
                      <Check size={13} className="text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Full Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opaque Full Text Container */}
              <div className="rounded-2xl border border-[#ded5c2] dark:border-white/15 bg-[#f7f4ed] dark:bg-[#0d0c10] p-4 text-xs font-sans text-[#121110] dark:text-[#fdfdfd] leading-relaxed whitespace-pre-wrap select-all max-h-56 overflow-y-auto shadow-inner">
                {fullAnnouncementMessage}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleWhatsAppShare}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Send directly to WhatsApp
                </button>
              </div>
            </div>
          )}

          {activeTab === "qr" && (
            <div className="space-y-4 text-center py-2">
              <p className="text-xs text-[#574f45] dark:text-[#a1a1aa] max-w-sm mx-auto leading-relaxed">
                Scan with any phone camera to access gate registration instantly. High-resolution export for church projector screens and printed flyers.
              </p>

              <div className="inline-flex p-4 rounded-2xl bg-white border border-[#ded5c2] dark:border-white/20 shadow-md">
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  disabled={downloadingQr}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-[#8a5e14] hover:bg-[#734e0f] text-white dark:bg-[#e2c073] dark:hover:bg-[#fceec5] dark:text-[#121110] inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download size={15} />
                  <span>{downloadingQr ? "Preparing..." : "Download QR Badge (PNG)"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold border border-[#d5cdbf] dark:border-white/15 bg-[#f5f1e8] dark:bg-[#1e1c25] text-[#121110] dark:text-white hover:bg-[#ede7dc] dark:hover:bg-[#282532] inline-flex items-center justify-center gap-1.5 transition-all"
                >
                  <Copy size={14} /> Copy Registration Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer (Solid Opaque Bar) */}
        <div className="p-4 sm:p-5 border-t border-[#ece6d9] dark:border-white/10 bg-[#faf8f4] dark:bg-[#191720] flex items-center justify-between text-xs text-[#574f45] dark:text-[#a1a1aa]">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles size={13} className="text-[#8a5e14] dark:text-[#e2c073]" /> Selah Event Sharing
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-[#121110] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
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
            {label && <span>{label}</span>}
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
