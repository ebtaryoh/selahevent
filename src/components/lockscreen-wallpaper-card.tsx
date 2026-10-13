"use client";

import { useState } from "react";
import { Smartphone, Download, Bell, Check, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

type Props = {
  verse: string;
  reference: string;
  theme: string;
};

export function LockscreenWallpaperCard({ verse, reference, theme }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [notifRequested, setNotifRequested] = useState(false);

  // Generate 1080x1920 HD phone lockscreen wallpaper using Canvas
  const handleGenerateWallpaper = () => {
    setDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        setDownloading(false);
        return;
      }

      // 1. Background gradient (Rich Dark Cypress #0a1f19 to Deep Night #060809)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
      bgGrad.addColorStop(0, "#0a1f19");
      bgGrad.addColorStop(0.5, "#060809");
      bgGrad.addColorStop(1, "#030405");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Subtle architectural church arch glow in the center
      const glowGrad = ctx.createRadialGradient(540, 960, 50, 540, 960, 600);
      glowGrad.addColorStop(0, "rgba(192, 138, 46, 0.15)");
      glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 3. Selah Arch outline
      ctx.strokeStyle = "rgba(192, 138, 46, 0.35)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(540, 500, 180, Math.PI, 0, false);
      ctx.stroke();

      // Cross symbol inside arch
      ctx.strokeStyle = "rgba(192, 138, 46, 0.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(540, 380);
      ctx.lineTo(540, 460);
      ctx.moveTo(510, 410);
      ctx.lineTo(570, 410);
      ctx.stroke();

      // 4. Header: SELAH DAILY SANCTUARY
      ctx.fillStyle = "#c08a2e";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.letterSpacing = "6px";
      ctx.fillText("SELAH · DAILY SANCTUARY", 540, 680);

      // Theme Tag
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.font = "500 24px sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText(theme.toUpperCase(), 540, 730);

      // 5. Verse Text (Word-wrapped nicely in the golden ratio section)
      ctx.fillStyle = "#f6f3eb";
      ctx.font = "italic 46px serif";
      ctx.textAlign = "center";

      const words = verse.split(" ");
      let line = "";
      let y = 880;
      const maxWidth = 860;
      const lineHeight = 72;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(`“${line.trim()}”`.replace(/^““/, "“"), 540, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 540, y);

      // 6. Scripture Reference
      ctx.fillStyle = "#e2c073";
      ctx.font = "bold 34px sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText(`— ${reference} —`, 540, y + 100);

      // 7. Bottom Footnote
      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "20px sans-serif";
      ctx.letterSpacing = "3px";
      ctx.fillText("PAUSE · REST · REFLECT · SELAH.EVENTS", 540, 1800);

      // Download as PNG
      const link = document.createElement("a");
      link.download = `selah-lockscreen-${reference.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Failed to generate lockscreen wallpaper:", e);
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestNotification = async () => {
    setNotifRequested(true);
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setNotifGranted(true);
        new Notification("Selah Daily Sanctuary", {
          body: `Daily Scripture anchor set: "${reference}". Morning prayers begin at 6:00 AM.`,
          icon: "/icons/icon-192.png",
        });
      }
    }
  };

  return (
    <div className="rounded-2xl border border-brass/25 bg-gradient-to-br from-brass/10 via-paper to-paper p-6 sm:p-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brass/20 text-brass border border-brass/40 shadow-md">
            <Smartphone size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-ink text-sm sm:text-base">
              Set Today&apos;s Scripture on Your Phone Lock-Screen
            </h4>
            <p className="text-xs text-warm-500 mt-0.5">
              Keep God&apos;s Word in front of your eyes every time you check your phone.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateWallpaper}
            disabled={downloading}
            className="btn btn-brass !py-2 !px-4 !text-xs font-semibold cursor-pointer shadow-md shadow-brass/20 flex items-center gap-1.5"
          >
            {downloading ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Generating HD Wallpaper...
              </>
            ) : (
              <>
                <Download size={13} /> Save Lock-Screen (9:16 PNG)
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRequestNotification}
            className={cn(
              "btn !py-2 !px-3 !text-xs cursor-pointer transition-colors flex items-center gap-1.5",
              notifGranted
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "btn-secondary text-warm-400 hover:text-ink"
            )}
          >
            {notifGranted ? (
              <>
                <Check size={13} className="text-emerald-400" /> Daily Reminders Set
              </>
            ) : (
              <>
                <Bell size={13} /> Daily Confession Reminder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
