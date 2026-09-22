"use client";

import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useParams } from "next/navigation";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { SectionHead } from "@/components/ui";

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
      <SectionHead 
        title="Scan Tickets" 
        description="Use your camera to check in attendees." 
        eyebrow="Scanner"
      />

      <div className="mt-8 rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-white p-6 shadow-sm">
        
        {/* State Indicators */}
        <div className={`mb-6 flex flex-col items-center justify-center p-4 rounded-xl text-center transition-colors
          ${scanResult.status === "idle" ? "bg-parchment text-ink" : ""}
          ${scanResult.status === "scanning" ? "bg-blue-50 text-blue-700" : ""}
          ${scanResult.status === "success" ? "bg-green-50 text-green-700" : ""}
          ${scanResult.status === "error" ? "bg-red-50 text-red-700" : ""}
        `}>
          {scanResult.status === "success" && <CheckCircle2 size={32} className="mb-2 text-green-600" />}
          {scanResult.status === "error" && <XCircle size={32} className="mb-2 text-red-600" />}
          
          <h3 className="font-semibold text-lg">{scanResult.message}</h3>
          
          {scanResult.ticketDetails && (
            <div className="mt-2 text-sm text-green-800">
              <p><strong>Name:</strong> {scanResult.ticketDetails.attendeeName}</p>
              <p><strong>Type:</strong> {scanResult.ticketDetails.ticketType}</p>
            </div>
          )}
        </div>

        {/* Scanner Container */}
        <div className="overflow-hidden rounded-xl border-2 border-dashed border-warm-200">
          <div id="qr-reader" className="w-full"></div>
        </div>

      </div>
    </div>
  );
}
