"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X, Sparkles, Tag, Check, Award } from "lucide-react";
import { cn } from "@/lib/format";

export type BadgeData = {
  name: string;
  eventTitle: string;
  ticketCode: string;
  ticketName?: string;
  attendeeType?: string;
  church?: string;
  city?: string;
  brandColor?: string | null;
};

type BadgeSize = "lanyard" | "sticker";

export function BadgeModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: BadgeData | null;
}) {
  const [size, setSize] = useState<BadgeSize>("lanyard");

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const role = (data.attendeeType || data.ticketName || "DELEGATE").toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-paper p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/10">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(226,192,115,0.15)] text-[var(--color-brass)]">
              <Award size={18} />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold text-ink">Attendee Name Badge</h3>
              <p className="text-xs text-warm-500">Preview & print desk lanyard or sticker</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-warm-400 hover:bg-black/5 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Badge Options Bar */}
        <div className="my-4 flex items-center justify-between gap-3 text-xs">
          <span className="font-medium text-warm-600">Badge Format:</span>
          <div className="flex rounded-xl border border-black/10 bg-warm-100 p-0.5">
            <button
              type="button"
              onClick={() => setSize("lanyard")}
              className={cn(
                "rounded-lg px-3 py-1 font-medium transition-colors",
                size === "lanyard" ? "bg-white text-ink shadow-xs" : "text-warm-500 hover:text-ink"
              )}
            >
              4×3" Lanyard
            </button>
            <button
              type="button"
              onClick={() => setSize("sticker")}
              className={cn(
                "rounded-lg px-3 py-1 font-medium transition-colors",
                size === "sticker" ? "bg-white text-ink shadow-xs" : "text-warm-500 hover:text-ink"
              )}
            >
              3.5×2" Sticker
            </button>
          </div>
        </div>

        {/* Badge Preview Canvas */}
        <div className="flex justify-center p-4 bg-warm-200/50 rounded-2xl border border-black/5">
          <div
            id="selah-printable-badge"
            className={cn(
              "relative bg-white text-ink rounded-xl border-2 border-black/15 shadow-md flex flex-col justify-between overflow-hidden transition-all",
              size === "lanyard" ? "w-[360px] h-[270px] p-6" : "w-[320px] h-[190px] p-4"
            )}
          >
            {/* Top Bar: Event Title & Role Pill */}
            <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2.5">
              <div className="truncate">
                <span className="text-[0.625rem] font-bold tracking-widest text-warm-400 uppercase">
                  Event Pass
                </span>
                <div className="truncate font-semibold text-xs text-ink leading-tight">
                  {data.eventTitle}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-[0.625rem] font-bold tracking-wider text-white uppercase">
                {role}
              </span>
            </div>

            {/* Middle: Huge Attendee Name & Church */}
            <div className="my-auto text-center py-2">
              <h2 className={cn("font-display font-bold tracking-tight text-ink leading-none", size === "lanyard" ? "text-2xl" : "text-xl")}>
                {data.name}
              </h2>
              {data.church || data.city ? (
                <p className="mt-1.5 text-xs font-medium text-warm-600 truncate">
                  {data.church ? data.church : ""}
                  {data.church && data.city ? " · " : ""}
                  {data.city ? data.city : ""}
                </p>
              ) : null}
            </div>

            {/* Bottom: QR Code & Ticket Code */}
            <div className="flex items-center justify-between pt-2 border-t border-black/10">
              <div className="text-left">
                <div className="text-[0.565rem] font-semibold tracking-wider text-warm-400 uppercase">
                  Pass Code
                </div>
                <div className="font-mono text-xs font-bold tracking-wider text-ink">
                  {data.ticketCode}
                </div>
              </div>
              <div className="rounded-md border border-black/10 bg-white p-1">
                <QRCodeSVG
                  value={`SELAH:${data.ticketCode}`}
                  size={size === "lanyard" ? 44 : 36}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-black/10">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost !px-4 !py-2 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary !px-5 !py-2 text-xs shadow-md"
          >
            <Printer size={15} /> Print Badge
          </button>
        </div>
      </div>

      {/* Badge Print CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #selah-printable-badge,
          #selah-printable-badge * {
            visibility: visible !important;
          }
          #selah-printable-badge {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
