"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Download,
  Share2,
  Sparkles,
  Camera,
  Check,
  Copy,
  RefreshCw,
  Palette,
  Layout,
  ExternalLink,
  Calendar,
  MapPin,
  Building2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatDate, formatRange } from "@/lib/format";

export type AttendingPosterEvent = {
  id: string;
  title: string;
  slug: string;
  theme?: string | null;
  tagline?: string | null;
  startsAt: string | Date;
  endsAt: string | Date;
  venueName?: string | null;
  city?: string | null;
  organizationName?: string | null;
  coverImage?: string | null;
};

type ThemeKey = "obsidian" | "cypress" | "ivory";
type AspectKey = "square" | "story";

export function AttendingPosterGenerator({
  event,
  defaultName = "",
  isOrganizerView = false,
}: {
  event: AttendingPosterEvent;
  defaultName?: string;
  isOrganizerView?: boolean;
}) {
  const [name, setName] = useState(defaultName || "Sister Grace Adebayo");
  const [role, setRole] = useState("I Will Be Attending");
  const [church, setChurch] = useState(event.organizationName || "");
  const [theme, setTheme] = useState<ThemeKey>("obsidian");
  const [aspect, setAspect] = useState<AspectKey>("square");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [origin, setOrigin] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const publicPosterUrl = origin ? `${origin}/e/${event.slug}/poster` : `/e/${event.slug}/poster`;
  const registerUrl = origin ? `${origin}/e/${event.slug}` : `/e/${event.slug}`;

  // Handle local user photo selection
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(publicPosterUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Praise God! I will be attending "${event.title}"!\n\nJoin me for this life-transforming gathering.\nRegister here: ${registerUrl}\n\nGenerate your own attendance poster: ${publicPosterUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // High-Resolution Canvas Rendering Engine
  const generateAndDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const isSquare = aspect === "square";
      const W = 1080;
      const H = isSquare ? 1080 : 1920;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Background Fill & Gradients
      if (theme === "obsidian") {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, "#08080a");
        bgGrad.addColorStop(0.5, "#101015");
        bgGrad.addColorStop(1, "#08080a");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Radiant Sacred Gold Orbs
        const radial1 = ctx.createRadialGradient(W / 2, H * 0.35, 50, W / 2, H * 0.35, 550);
        radial1.addColorStop(0, "rgba(226, 192, 115, 0.22)");
        radial1.addColorStop(1, "rgba(226, 192, 115, 0)");
        ctx.fillStyle = radial1;
        ctx.fillRect(0, 0, W, H);
      } else if (theme === "cypress") {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, "#061812");
        bgGrad.addColorStop(0.5, "#0b2b21");
        bgGrad.addColorStop(1, "#05130f");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const radial = ctx.createRadialGradient(W / 2, H * 0.35, 50, W / 2, H * 0.35, 600);
        radial.addColorStop(0, "rgba(200, 165, 85, 0.24)");
        radial.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, W, H);
      } else {
        // Celestial Ivory
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, "#fbf9f5");
        bgGrad.addColorStop(0.5, "#f4ede2");
        bgGrad.addColorStop(1, "#ede3d3");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        const radial = ctx.createRadialGradient(W / 2, H * 0.35, 40, W / 2, H * 0.35, 500);
        radial.addColorStop(0, "rgba(192, 138, 46, 0.16)");
        radial.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, W, H);
      }

      // Outer Decorative Border Frame
      const borderColor = theme === "ivory" ? "rgba(192, 138, 46, 0.35)" : "rgba(226, 192, 115, 0.35)";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, W - 72, H - 72);

      // Inner subtle hairline
      ctx.strokeStyle = theme === "ivory" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(48, 48, W - 96, H - 96);

      // 2. Organization Eyebrow Badge (Top)
      const topY = isSquare ? 90 : 120;
      ctx.textAlign = "center";
      ctx.font = "bold 20px 'Cinzel', serif, Georgia";
      ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#e2c073";
      const orgText = (event.organizationName || "CHRISTIAN EVENT GATHERING").toUpperCase();
      ctx.fillText(`✦   ${orgText}   ✦`, W / 2, topY);

      // 3. Attendee Portrait Photo
      const photoSize = isSquare ? 320 : 420;
      const photoX = (W - photoSize) / 2;
      const photoY = isSquare ? 130 : 200;

      // Outer glowing arch/circle for photo
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2 + 10, 0, Math.PI * 2);
      ctx.strokeStyle = theme === "ivory" ? "rgba(192, 138, 46, 0.7)" : "rgba(226, 192, 115, 0.85)";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Clip circle for attendee photo
      ctx.beginPath();
      ctx.arc(W / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (photoUrl) {
        const userImg = new window.Image();
        userImg.src = photoUrl;
        await new Promise((res) => {
          userImg.onload = res;
          userImg.onerror = res;
        });

        // Aspect fit fill center
        const imgAspect = userImg.width / userImg.height;
        let sWidth = userImg.width;
        let sHeight = userImg.height;
        let sx = 0;
        let sy = 0;

        if (imgAspect > 1) {
          sWidth = userImg.height;
          sx = (userImg.width - userImg.height) / 2;
        } else {
          sHeight = userImg.width;
          sy = (userImg.height - userImg.width) / 2;
        }

        ctx.drawImage(userImg, sx, sy, sWidth, sHeight, photoX, photoY, photoSize, photoSize);
      } else {
        // Default Spiritual Avatar Silhouette
        ctx.fillStyle = theme === "ivory" ? "#e5ded4" : "#1a2420";
        ctx.fillRect(photoX, photoY, photoSize, photoSize);

        ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#e2c073";
        ctx.font = "bold 90px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(name.charAt(0) || "✝", W / 2, photoY + photoSize / 2 + 30);
      }
      ctx.restore();

      // 4. "I WILL BE ATTENDING" Sacred Ribbon Banner
      const ribbonY = photoY + photoSize + (isSquare ? 45 : 65);
      const ribbonW = 480;
      const ribbonH = 50;
      const ribbonX = (W - ribbonW) / 2;

      ctx.save();
      // Ribbon fill
      ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#c08a2e";
      ctx.beginPath();
      ctx.roundRect(ribbonX, ribbonY - 34, ribbonW, ribbonH, 25);
      ctx.fill();

      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.letterSpacing = "2px";
      ctx.fillText(role.toUpperCase(), W / 2, ribbonY);
      ctx.restore();

      // 5. Attendee Name
      const nameY = ribbonY + (isSquare ? 55 : 85);
      ctx.font = "bold 44px 'Playfair Display', serif, Georgia";
      ctx.fillStyle = theme === "ivory" ? "#161618" : "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText(name, W / 2, nameY);

      // Optional Church / Branch
      if (church) {
        ctx.font = "italic 22px 'Inter', sans-serif";
        ctx.fillStyle = theme === "ivory" ? "#665a4a" : "#c4b59d";
        ctx.fillText(church, W / 2, nameY + 32);
      }

      // Divider Line with Radiant Cross/Star
      const divY = nameY + (church ? 65 : 45);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 160, divY);
      ctx.lineTo(W / 2 + 160, divY);
      ctx.stroke();

      ctx.font = "18px sans-serif";
      ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#e2c073";
      ctx.fillText("✦", W / 2, divY + 6);

      // 6. Event Title & Theme
      const eventTitleY = divY + (isSquare ? 48 : 80);
      ctx.font = "bold 38px 'Playfair Display', serif, Georgia";
      ctx.fillStyle = theme === "ivory" ? "#141416" : "#ffffff";
      ctx.fillText(event.title, W / 2, eventTitleY);

      if (event.theme) {
        ctx.font = "italic 22px 'Playfair Display', serif";
        ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#e2c073";
        ctx.fillText(`“${event.theme}”`, W / 2, eventTitleY + 36);
      }

      // 7. Event Date & Venue (Bottom Section)
      const detailsY = isSquare ? H - 120 : H - 240;
      ctx.font = "600 22px 'Inter', sans-serif";
      ctx.fillStyle = theme === "ivory" ? "#2a2622" : "#e8d3a6";
      const dateString = formatRange(event.startsAt, event.endsAt);
      ctx.fillText(`📅 ${dateString}`, W / 2, detailsY);

      const venueString = [event.venueName, event.city].filter(Boolean).join(" · ");
      if (venueString) {
        ctx.font = "500 20px 'Inter', sans-serif";
        ctx.fillStyle = theme === "ivory" ? "#5a5044" : "#a89f91";
        ctx.fillText(`📍 ${venueString}`, W / 2, detailsY + 34);
      }

      // 8. Scannable QR Code on Poster
      const qrElement = document.getElementById("hidden-poster-qr-code");
      if (qrElement) {
        const xml = new XMLSerializer().serializeToString(qrElement);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const image64 = "data:image/svg+xml;base64," + svg64;
        const qrImg = new window.Image();
        qrImg.src = image64;
        await new Promise((res) => {
          qrImg.onload = res;
          qrImg.onerror = res;
        });

        const qrSize = isSquare ? 90 : 130;
        const qrX = W - qrSize - 60;
        const qrY = H - qrSize - 60;

        // White badge behind QR for crisp scanner contrast
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 14);
        ctx.fill();
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // QR label
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillStyle = theme === "ivory" ? "#333333" : "#000000";
        ctx.textAlign = "center";
        ctx.fillText("SCAN TO JOIN ME", qrX + qrSize / 2, qrY + qrSize + 6);
      }

      // Footer Selah Mark / App Credential
      ctx.textAlign = "left";
      ctx.font = "bold 16px 'Inter', sans-serif";
      ctx.fillStyle = theme === "ivory" ? "#8a6218" : "#c08a2e";
      ctx.fillText("SELAH · Event Operating System", 60, H - 60);

      // Export to high-res PNG download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeSlug = event.slug || "event";
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      link.download = `attending-${safeSlug}-${safeName}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error("Poster generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hidden QR Code for Canvas rendering */}
      <div className="hidden">
        <QRCodeSVG
          id="hidden-poster-qr-code"
          value={registerUrl}
          size={180}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
          includeMargin={false}
        />
        <canvas ref={canvasRef} />
      </div>

      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brass/35 bg-brass/10 px-3.5 py-1 text-xs font-semibold text-brass mb-3">
            <Sparkles size={13} />
            <span>Official Event Attendance Flyer &amp; DP Generator</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink">
            {isOrganizerView ? "Attendee Custom Poster Generator" : "I Will Be Attending · Custom DP"}
          </h1>
          <p className="mt-2 text-sm text-warm-500 max-w-2xl leading-relaxed">
            {isOrganizerView
              ? "Your attendees and delegates can personalize this high-definition social poster with their own photo and name to broadcast on WhatsApp Status, Instagram, and Facebook."
              : "Upload your photo, type your name, and download your customized attendance badge to invite brethren and friends!"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-secondary !py-2.5 !px-4 text-xs font-semibold"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-400" /> Copied Public Link!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Public Generator Link
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="btn btn-brass !py-2.5 !px-4 text-xs font-semibold"
          >
            <Share2 size={14} /> Share to WhatsApp
          </button>
        </div>
      </div>

      {/* Main 2-Column Interface: Controls on Left, Live Realistic Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-5 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-xl">
          <h3 className="font-display text-lg font-semibold text-ink flex items-center gap-2">
            <Palette size={18} className="text-brass" /> Personalize Your Poster
          </h3>

          {/* 1. Upload Photo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              1. Attendee Photo / Portrait
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-brass/50 bg-brass/10 hover:bg-brass/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all shrink-0 group"
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="Attendee" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <Camera size={24} className="text-brass group-hover:scale-110 transition-transform" />
                    <span className="text-[0.62rem] font-bold text-brass mt-1">Upload</span>
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary !py-2 !px-3.5 !text-xs font-semibold w-full sm:w-auto"
                >
                  <Camera size={14} /> {photoUrl ? "Change Photo" : "Upload Your Picture"}
                </button>
                <p className="text-[0.7rem] text-warm-500 mt-1.5 leading-snug">
                  Choose a clear portrait. The generator automatically cuts it into an elegant gold-bordered sanctuary circle.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
            </div>
          </div>

          {/* 2. Attendee Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              2. Your Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pastor David Adeleke"
              className="input !w-full"
            />
          </div>

          {/* 3. Role / Headline */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              3. Attendance Badge / Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "I Will Be Attending",
                "I Am Attending",
                "Delegate",
                "Minister / Clergy",
                "Guest Speaker",
                "Volunteer Steward",
                "Worshiper",
                "Youth Member",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                    role === r
                      ? "border-brass bg-brass/20 text-brass font-bold"
                      : "border-white/10 bg-white/5 text-warm-400 hover:bg-white/10"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Assembly / Chapter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              4. Assembly / Chapter / Branch (Optional)
            </label>
            <input
              type="text"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              placeholder="e.g. RCCG City of David, Lagos"
              className="input !w-full"
            />
          </div>

          {/* 5. Theme Palette */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              5. Visual Design Theme
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { key: "obsidian", label: "Obsidian & Gold", dot: "#e2c073", bg: "#08080a" },
                { key: "cypress", label: "Cypress Sanctuary", dot: "#34d399", bg: "#072017" },
                { key: "ivory", label: "Celestial Ivory", dot: "#b45309", bg: "#fbf9f5" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key as ThemeKey)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    theme === t.key
                      ? "border-brass ring-2 ring-brass/30 shadow-lg"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: t.bg }}
                >
                  <div
                    className="h-4 w-4 rounded-full mx-auto mb-1.5 shadow-sm"
                    style={{ backgroundColor: t.dot }}
                  />
                  <div
                    className={`text-[0.68rem] font-bold ${
                      t.key === "ivory" ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {t.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Aspect Ratio Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-warm-400 mb-2">
              6. Format &amp; Dimensions
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAspect("square")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  aspect === "square"
                    ? "border-brass bg-brass/20 text-brass shadow-md"
                    : "border-white/10 bg-white/5 text-warm-400 hover:bg-white/10"
                }`}
              >
                <Layout size={14} /> Square (1:1 · DP)
              </button>
              <button
                type="button"
                onClick={() => setAspect("story")}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  aspect === "story"
                    ? "border-brass bg-brass/20 text-brass shadow-md"
                    : "border-white/10 bg-white/5 text-warm-400 hover:bg-white/10"
                }`}
              >
                <Layout size={14} className="rotate-90" /> Story (9:16 · Status)
              </button>
            </div>
          </div>

          {/* Download Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={generateAndDownload}
              disabled={isGenerating}
              className="btn btn-primary !w-full !py-3.5 !text-sm font-bold shadow-xl shadow-brass/25 cursor-pointer flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Rendering HD Poster...
                </>
              ) : (
                <>
                  <Download size={16} /> Download Poster Image (HD PNG)
                </>
              )}
            </button>

            {downloadSuccess && (
              <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Downloaded successfully! Ready to share on WhatsApp and Instagram.</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Poster Preview on Right */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs text-warm-500 mb-3 px-2">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-brass" /> Live Poster Preview
            </span>
            <span className="text-[0.7rem] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
              {aspect === "square" ? "1080 × 1080 px (Square DP)" : "1080 × 1920 px (WhatsApp Status)"}
            </span>
          </div>

          {/* Interactive Live Card Container */}
          <div
            className={`relative w-full max-w-[480px] overflow-hidden rounded-[32px] border-2 shadow-2xl transition-all duration-300 ${
              theme === "obsidian"
                ? "bg-[#09090c] text-white border-brass/40 shadow-black/80"
                : theme === "cypress"
                ? "bg-[#061812] text-white border-emerald-500/30 shadow-black/80"
                : "bg-[#fbf9f5] text-[#1a1816] border-[#e2d5c3] shadow-stone-400/30"
            }`}
            style={{
              aspectRatio: aspect === "square" ? "1 / 1" : "9 / 16",
            }}
          >
            {/* Background Halo */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                theme === "obsidian"
                  ? "bg-[radial-gradient(ellipse_at_center,rgba(226,192,115,0.18)_0%,transparent_75%)]"
                  : theme === "cypress"
                  ? "bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.16)_0%,transparent_75%)]"
                  : "bg-[radial-gradient(ellipse_at_center,rgba(192,138,46,0.12)_0%,transparent_75%)]"
              }`}
            />

            {/* Inner Border Frame */}
            <div className="absolute inset-3 rounded-[26px] border border-brass/25 pointer-events-none" />

            <div className="relative h-full flex flex-col justify-between p-7 sm:p-9 text-center">
              {/* Top Eyebrow */}
              <div>
                <div
                  className={`text-[0.62rem] sm:text-xs font-bold tracking-[0.2em] uppercase ${
                    theme === "ivory" ? "text-amber-800" : "text-brass-light"
                  }`}
                >
                  ✦ {event.organizationName || "CHRISTIAN EVENT OS"} ✦
                </div>
              </div>

              {/* Attendee Photo + Badge + Name */}
              <div className="flex flex-col items-center">
                {/* Circular Portrait Photo */}
                <div
                  className={`relative h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden border-4 shadow-xl ${
                    theme === "ivory" ? "border-amber-600 bg-amber-100/60" : "border-brass bg-black/40"
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt="Attendee Portrait" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-brass">
                      <Camera size={32} className="opacity-40" />
                      <span className="text-[0.6rem] font-bold uppercase mt-1 opacity-70">Add Photo</span>
                    </div>
                  )}
                </div>

                {/* Role Ribbon Badge */}
                <div
                  className={`-mt-3.5 z-10 px-4 py-1 rounded-full text-[0.68rem] font-bold uppercase tracking-wider text-white shadow-md ${
                    theme === "ivory" ? "bg-amber-700" : "bg-brass"
                  }`}
                >
                  {role}
                </div>

                {/* Attendee Name */}
                <h2 className="font-display text-xl sm:text-2xl font-bold mt-3 text-inherit">
                  {name || "Your Name"}
                </h2>
                {church && (
                  <p
                    className={`text-[0.72rem] italic mt-0.5 ${
                      theme === "ivory" ? "text-stone-600" : "text-warm-400"
                    }`}
                  >
                    {church}
                  </p>
                )}
              </div>

              {/* Event Title & Theme */}
              <div className="border-t border-brass/25 pt-3">
                <h3 className="font-display text-base sm:text-lg font-bold leading-tight text-inherit">
                  {event.title}
                </h3>
                {event.theme && (
                  <p
                    className={`text-xs italic mt-0.5 ${
                      theme === "ivory" ? "text-amber-800" : "text-brass"
                    }`}
                  >
                    “{event.theme}”
                  </p>
                )}

                {/* Date & Location */}
                <div
                  className={`mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.68rem] font-medium ${
                    theme === "ivory" ? "text-stone-700" : "text-warm-300"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-brass shrink-0" />
                    {formatDate(event.startsAt)}
                  </span>
                  {event.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-brass shrink-0" />
                      {event.city}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Scannable QR & Selah watermark */}
              <div className="flex items-end justify-between pt-2">
                <div className="text-left">
                  <div
                    className={`text-[0.6rem] font-bold tracking-wider ${
                      theme === "ivory" ? "text-amber-800" : "text-brass"
                    }`}
                  >
                    SELAH EVENT OS
                  </div>
                  <div className="text-[0.55rem] opacity-60">
                    Official Attendance Card
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-md">
                  <QRCodeSVG value={registerUrl} size={38} level="M" />
                  <div className="text-[0.55rem] text-black font-bold leading-tight text-left pr-1">
                    SCAN TO<br />JOIN ME
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick instructions under preview */}
          <p className="mt-4 text-xs text-warm-500 text-center max-w-sm">
            💡 Tap <strong>Download Poster Image</strong> to save the crystal-clear 1080p graphics file directly to your phone or computer.
          </p>
        </div>
      </div>
    </div>
  );
}
