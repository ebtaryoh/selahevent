"use client";

import { useState } from "react";
import { ImageDown, Loader2, Check } from "lucide-react";

export interface TicketImageData {
  eventTitle: string;
  attendeeName: string;
  ticketCode: string;
  ticketTier: string;
  qrCodeUrl: string;
  dateStr: string;
  venueName: string;
  tableNumber?: string | null;
  seatNumber?: string | null;
  accommodationType?: string | null;
}

export function SaveTicketImageButton({
  ticket,
  className,
}: {
  ticket: TicketImageData;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Create high-res canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // 600 x 900 high-res card
      canvas.width = 600;
      canvas.height = 900;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 900);
      bgGrad.addColorStop(0, "#0c1f19");
      bgGrad.addColorStop(1, "#07120f");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 900);

      // Gold border
      ctx.strokeStyle = "rgba(192, 138, 46, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, 568, 868);

      // Selah Brand Header
      ctx.fillStyle = "#c08a2e";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✦ SELAH ACCESS PASS ✦", 300, 60);

      // Ticket Tier Badge
      ctx.fillStyle = "rgba(192, 138, 46, 0.2)";
      ctx.beginPath();
      ctx.roundRect(180, 80, 240, 36, 18);
      ctx.fill();
      ctx.strokeStyle = "rgba(192, 138, 46, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#e0aa48";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(ticket.ticketTier.toUpperCase(), 300, 104);

      // Event Title (Wrap text if long)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      const words = ticket.eventTitle.split(" ");
      let line = "";
      let y = 160;
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 500 && i > 0) {
          ctx.fillText(line.trim(), 300, y);
          line = words[i] + " ";
          y += 36;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 300, y);

      // Attendee Name
      y += 44;
      ctx.fillStyle = "#c08a2e";
      ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(ticket.attendeeName, 300, y);

      // Load and draw QR code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = ticket.qrCodeUrl;

      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = () => {
          // Fallback: continue without throwing fatal error
          resolve(null);
        };
      });

      // White box for QR code
      const qrBoxY = y + 30;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(175, qrBoxY, 250, 250, 20);
      ctx.fill();

      // Draw QR image
      try {
        ctx.drawImage(qrImg, 195, qrBoxY + 15, 210, 210);
      } catch (e) {
        console.warn("Could not draw remote QR image, drawing code text fallback", e);
      }

      // Ticket Code beneath QR
      const codeY = qrBoxY + 295;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px monospace";
      ctx.letterSpacing = "4px";
      ctx.fillText(ticket.ticketCode, 300, codeY);

      // Table & Seat / Lodging info
      let metaY = codeY + 45;
      if (ticket.tableNumber || ticket.accommodationType) {
        ctx.fillStyle = "#e0aa48";
        ctx.font = "600 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        const metaParts = [];
        if (ticket.tableNumber) metaParts.push(`Table: ${ticket.tableNumber}${ticket.seatNumber ? ` · Seat ${ticket.seatNumber}` : ""}`);
        if (ticket.accommodationType) metaParts.push(`Dorm/Room: ${ticket.accommodationType}`);
        ctx.fillText(metaParts.join("   |   "), 300, metaY);
        metaY += 35;
      }

      // Logistics: Date & Venue
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(`🗓️ ${ticket.dateStr}`, 300, metaY);
      metaY += 25;
      ctx.fillText(`📍 ${ticket.venueName}`, 300, metaY);

      // Security Footer
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Valid for entry · Present QR code to usher or turnstile scanner", 300, 850);

      // Convert to PNG & Download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket-${ticket.ticketCode}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("Failed to generate ticket image:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className={
        className ||
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-6 py-3.5 text-[0.9rem] font-semibold text-sky-300 transition-all hover:bg-sky-500/20 active:scale-[0.98] cursor-pointer"
      }
    >
      {downloading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Saving to Photos...</span>
        </>
      ) : downloaded ? (
        <>
          <Check size={16} className="text-emerald-400" />
          <span>Saved to Photos Gallery!</span>
        </>
      ) : (
        <>
          <ImageDown size={16} className="text-sky-400" />
          <span>Save Pass to Photos Gallery (Offline)</span>
        </>
      )}
    </button>
  );
}
