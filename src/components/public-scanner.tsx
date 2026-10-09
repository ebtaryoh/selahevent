"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckCircle2, XCircle } from "lucide-react";

export function PublicScanner({ eventId, magicToken }: { eventId: string, magicToken: string }) {
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "scanning" | "success" | "error";
    message: string;
    ticketDetails?: any;
  }>({ status: "idle", message: "Point your camera at a ticket QR code." });

  const isScanningRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

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
          body: JSON.stringify({ ticketId: decodedText, magicToken }),
        });

        const data = await res.json();

        if (!res.ok) {
          playBeep("error");
          setScanResult({ status: "error", message: data.error || "Invalid ticket." });
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

        setTimeout(() => {
          setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
          isScanningRef.current = false;
        }, 4000);
      } catch (err) {
        playBeep("error");
        setScanResult({ status: "error", message: "Network error verifying ticket." });
        setTimeout(() => {
          setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." });
          isScanningRef.current = false;
        }, 3000);
      }
    }

    function onScanFailure(error: any) {}

    let scanner: Html5QrcodeScanner | null = null;
    
    // We use a small timeout to let React Strict Mode's rapid mount/unmount cycle settle.
    // Otherwise, the async scanner.clear() overlaps with the next scanner.render() and duplicates the UI.
    const timeoutId = setTimeout(() => {
      scanner = new Html5QrcodeScanner(
        "public-qr-reader",
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
  }, [eventId, magicToken]);

  return (
    <div className="card p-6 shadow-xl">
      <div className={`mb-6 flex flex-col items-center justify-center p-4 rounded-xl text-center transition-colors border
        ${scanResult.status === "idle" ? "border-warm-200 bg-warm-100 text-warm-600" : ""}
        ${scanResult.status === "scanning" ? "border-blue-200 bg-blue-50 text-blue-700" : ""}
        ${scanResult.status === "success" ? "border-green-200 bg-green-50 text-green-700" : ""}
        ${scanResult.status === "error" ? "border-red-200 bg-red-50 text-red-700" : ""}
      `}>
        {scanResult.status === "success" && <CheckCircle2 size={32} className="mb-2 text-green-500" />}
        {scanResult.status === "error" && <XCircle size={32} className="mb-2 text-red-500" />}
        
        <h3 className="font-semibold text-lg">{scanResult.message}</h3>
        
        {scanResult.ticketDetails && (
          <div className="mt-2 text-sm text-green-800 font-medium">
            <p><strong>Name:</strong> {scanResult.ticketDetails.attendeeName}</p>
            <p><strong>Type:</strong> {scanResult.ticketDetails.ticketType}</p>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        #public-qr-reader, #public-qr-reader * {
          color: #161311 !important;
        }
        #public-qr-reader a {
          color: var(--color-brass-deep) !important;
          text-decoration: underline !important;
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        #public-qr-reader a:hover {
          color: #161311 !important;
        }
      `}} />

      <div className="overflow-hidden rounded-xl border-2 border-dashed border-[rgba(22,19,17,0.2)] bg-white p-2">
        <div id="public-qr-reader" className="w-full [&_button]:btn [&_button]:btn-brass [&_button]:!py-2 [&_button]:!px-4 [&_button]:mt-4 [&_select]:bg-white [&_select]:text-ink [&_select]:border [&_select]:border-[rgba(22,19,17,0.2)] [&_select]:rounded-lg [&_select]:p-2"></div>
      </div>
    </div>
  );
}
