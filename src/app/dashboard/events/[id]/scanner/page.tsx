"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useParams } from "next/navigation";
import { CheckCircle2, QrCode, XCircle, Radio, Utensils, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { offlineGateCache } from "@/lib/offline-gate-cache";


export default function ScannerPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "scanning" | "success" | "error";
    message: string;
    ticketDetails?: any;
  }>({ status: "idle", message: "Point your camera at a ticket QR code." });

  const isScanningRef = useRef(false);

  useEffect(() => {
    // Ensure this only runs in browser
    if (typeof window === "undefined") return;


    // Helper to play a beep sound using Web Audio API
    const playBeep = (type: "success" | "error") => {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === "success") {
          osc.type = "sine";
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        } else {
          osc.type = "square";
          osc.frequency.setValueAtTime(300, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
        }
      } catch (e) {
        console.error("Audio play failed", e);
      }
    };

    async function onScanSuccess(decodedText: string) {
      if (isScanningRef.current) return;
      isScanningRef.current = true;
      
      setScanResult({ status: "scanning", message: "Verifying ticket..." });

      try {
        const res = await fetch(`/api/events/${eventId}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: decodedText }),
        });

        const data = await res.json();

        if (!res.ok) {
          playBeep("error");
          setScanResult({ status: "error", message: data.error || "Invalid ticket." });
          // Reset after 3 seconds
          setTimeout(() => {
            setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
            isScanningRef.current = false;
          }, 3000);
          return;
        }

        playBeep("success");
        setScanResult({ 
          status: "success", 
          message: "Ticket Verified!",
          ticketDetails: data
        });

        // Reset after 4 seconds
        setTimeout(() => {
          setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
          isScanningRef.current = false;
        }, 4000);

      } catch (err) {
        // Fallback to offline cache
        const offlineResult = offlineGateCache.verifyOffline(eventId, decodedText);
        if (offlineResult.valid && offlineResult.attendee) {
          playBeep("success");
          setScanResult({
            status: "success",
            message: "Ticket Verified (Offline Cache)!",
            ticketDetails: {
              attendeeName: offlineResult.attendee.name,
              ticketType: `${offlineResult.attendee.tier} • Offline Mode`,
              tableNumber: offlineResult.attendee.table,
              seatNumber: offlineResult.attendee.seat,
            },
          });
          setTimeout(() => {
            setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
            isScanningRef.current = false;
          }, 4000);
          return;
        }

        playBeep("error");
        setScanResult({
          status: "error",
          message: offlineResult.error || "Network error verifying ticket.",
        });
        setTimeout(() => {
          setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
          isScanningRef.current = false;
        }, 3000);
      }
    }

    function onScanFailure(error: any) {
      // Ignore background scan failures
    }

    let scanner: Html5QrcodeScanner | null = null;
    
    // Use a small timeout to avoid React Strict Mode double-mount bugs duplicating the UI
    const timeoutId = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render(onScanSuccess, onScanFailure);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [eventId]);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const { generateScannerLink } = await import("@/lib/actions/scanner");
      const link = await generateScannerLink(eventId);
      await navigator.clipboard.writeText(link);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error(e);
      alert("Failed to generate link");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-white">Scan Tickets</h1>
          <p className="mt-2 text-white/60">Use your camera to check in attendees.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link
            href={`/dashboard/events/${eventId}/turnstile`}
            className="btn btn-light"
          >
            <Radio size={16} className="text-emerald-400" /> Turnstile Gate Kiosk
          </Link>
          <button 
            onClick={handleCopyLink}
            className="btn btn-brass"
          >
            {isCopied ? "Link Copied!" : "Copy Volunteer Scanner Link"}
          </button>
        </div>
      </div>

      <div className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(16,16,18,0.7)] backdrop-blur-2xl p-6 shadow-2xl">
        
        {/* State Indicators */}
        <div className={`mb-6 flex flex-col items-center justify-center p-4 rounded-xl text-center transition-colors border
          ${scanResult.status === "idle" ? "border-white/10 bg-white/5 text-white/80" : ""}
          ${scanResult.status === "scanning" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : ""}
          ${scanResult.status === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : ""}
          ${scanResult.status === "error" ? "border-red-500/30 bg-red-500/10 text-red-400" : ""}
        `}>
          {scanResult.status === "success" && (
            scanResult.ticketDetails?.isProductVoucher ? (
              <ShoppingBag size={32} className="mb-2 text-amber-400 animate-bounce" />
            ) : (
              <CheckCircle2 size={32} className="mb-2 text-green-400" />
            )
          )}
          {scanResult.status === "error" && <XCircle size={32} className="mb-2 text-red-400" />}
          
          <h3 className="font-semibold text-lg">{scanResult.message}</h3>
          
          {scanResult.ticketDetails?.isProductVoucher ? (
            <div className="mt-3 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <ShoppingBag size={15} /> Resource Desk Pickup Voucher
              </div>
              <div className="mt-2 space-y-1 text-sm text-white font-medium">
                <p><strong>Item:</strong> {scanResult.ticketDetails.productName}</p>
                {scanResult.ticketDetails.variant && (
                  <p><strong>Option:</strong> <span className="bg-amber-500/20 px-2 py-0.5 rounded text-xs text-amber-200">{scanResult.ticketDetails.variant}</span></p>
                )}
                <p><strong>Quantity:</strong> {scanResult.ticketDetails.quantity}</p>
                <p><strong>Attendee:</strong> {scanResult.ticketDetails.customerName}</p>
                <p className="text-xs font-mono text-white/60"><strong>Voucher:</strong> {scanResult.ticketDetails.pickupVoucherCode}</p>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-2 text-center text-xs font-bold text-emerald-300">
                ✅ Marked as Collected &amp; Fulfilled
              </div>
            </div>
          ) : scanResult.ticketDetails ? (
            <div className="mt-2 text-sm text-green-300">
              <p><strong>Name:</strong> {scanResult.ticketDetails.attendeeName}</p>
              <p><strong>Type:</strong> {scanResult.ticketDetails.ticketType}</p>
              {scanResult.ticketDetails.tableNumber && (
                <p className="text-yellow-300 font-semibold mt-1 flex items-center justify-center gap-1">
                  <Utensils size={14} /> Table: {scanResult.ticketDetails.tableNumber}
                  {scanResult.ticketDetails.seatNumber ? ` • Seat ${scanResult.ticketDetails.seatNumber}` : ""}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {/* Scanner Container */}
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-black/40">
          <div id="qr-reader" className="w-full text-white [&_button]:btn [&_button]:btn-brass [&_button]:!py-2 [&_button]:!px-4 [&_button]:mt-4 [&_select]:bg-black/80 [&_select]:text-white [&_select]:border [&_select]:border-white/20 [&_select]:rounded-lg [&_select]:p-2"></div>
        </div>

      </div>
    </div>
  );
}
