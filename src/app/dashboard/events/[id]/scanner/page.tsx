"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useParams } from "next/navigation";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";


export default function ScannerPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [scanResult, setScanResult] = useState<{
    status: "idle" | "scanning" | "success" | "error";
    message: string;
    ticketDetails?: any;
  }>({ status: "idle", message: "Point your camera at a ticket QR code." });

  useEffect(() => {
    // Ensure this only runs in browser
    if (typeof window === "undefined") return;

    let scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    async function onScanSuccess(decodedText: string) {
      if (scanResult.status === "scanning") return;
      
      setScanResult({ status: "scanning", message: "Verifying ticket..." });

      try {
        const res = await fetch(`/api/events/${eventId}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: decodedText }),
        });

        const data = await res.json();

        if (!res.ok) {
          setScanResult({ status: "error", message: data.error || "Invalid ticket." });
          // Reset after 3 seconds
          setTimeout(() => setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." }), 3000);
          return;
        }

        setScanResult({ 
          status: "success", 
          message: "Ticket Verified!",
          ticketDetails: data
        });

        // Reset after 4 seconds
        setTimeout(() => setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." }), 4000);

      } catch (err) {
        setScanResult({ status: "error", message: "Network error verifying ticket." });
        setTimeout(() => setScanResult({ status: "idle", message: "Point your camera at a ticket QR code." }), 3000);
      }
    }

    function onScanFailure(error: any) {
      // Ignore background scan failures
    }

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [eventId, scanResult.status]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-white">Scan Tickets</h1>
        <p className="mt-2 text-white/60">Use your camera to check in attendees.</p>
      </div>

      <div className="mt-8 rounded-[24px] border border-white/10 bg-[rgba(16,16,18,0.7)] backdrop-blur-2xl p-6 shadow-2xl">
        
        {/* State Indicators */}
        <div className={`mb-6 flex flex-col items-center justify-center p-4 rounded-xl text-center transition-colors border
          ${scanResult.status === "idle" ? "border-white/10 bg-white/5 text-white/80" : ""}
          ${scanResult.status === "scanning" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : ""}
          ${scanResult.status === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : ""}
          ${scanResult.status === "error" ? "border-red-500/30 bg-red-500/10 text-red-400" : ""}
        `}>
          {scanResult.status === "success" && <CheckCircle2 size={32} className="mb-2 text-green-400" />}
          {scanResult.status === "error" && <XCircle size={32} className="mb-2 text-red-400" />}
          
          <h3 className="font-semibold text-lg">{scanResult.message}</h3>
          
          {scanResult.ticketDetails && (
            <div className="mt-2 text-sm text-green-300">
              <p><strong>Name:</strong> {scanResult.ticketDetails.attendeeName}</p>
              <p><strong>Type:</strong> {scanResult.ticketDetails.ticketType}</p>
            </div>
          )}
        </div>

        {/* Scanner Container */}
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-white/20 bg-black/40">
          <div id="qr-reader" className="w-full text-white [&_button]:btn [&_button]:btn-brass [&_button]:!py-2 [&_button]:!px-4 [&_button]:mt-4 [&_select]:bg-black/80 [&_select]:text-white [&_select]:border [&_select]:border-white/20 [&_select]:rounded-lg [&_select]:p-2"></div>
        </div>

      </div>
    </div>
  );
}
