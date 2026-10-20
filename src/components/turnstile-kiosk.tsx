"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Volume2,
  VolumeX,
  Usb,
  CheckCircle2,
  XCircle,
  QrCode,
  Lock,
  Unlock,
  Radio,
  Sparkles,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Camera,
  CameraOff,
  Keyboard,
  Wifi,
  WifiOff,
  Utensils,
  Zap,
} from "lucide-react";
import { turnstileRelay, type TurnstileConfig } from "@/lib/turnstile-relay";
import { offlineGateCache } from "@/lib/offline-gate-cache";
import { cn } from "@/lib/utils";

type GateState = "idle" | "verifying" | "unlocked" | "denied";

interface TurnstileKioskProps {
  event: {
    id: string;
    title: string;
    slug: string;
    city: string;
  };
  initialStats?: {
    checkedIn: number;
    registered: number;
  };
  sampleRealTicket?: {
    code: string;
    name: string;
  };
}

export function TurnstileKiosk({
  event,
  initialStats,
  sampleRealTicket,
}: TurnstileKioskProps) {
  const [gateState, setGateState] = useState<GateState>("idle");
  const [attendeeInfo, setAttendeeInfo] = useState<{
    name?: string;
    ticketName?: string;
    ticketCode?: string;
    gate?: string;
    error?: string;
    table?: string;
    seat?: string;
  } | null>(null);

  const [checkedInCount, setCheckedInCount] = useState(initialStats?.checkedIn || 0);

  // Offline Venue Resilience
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Turnstile Hardware Configuration
  const [config, setConfig] = useState<TurnstileConfig>({
    gateName: "Turnstile Gate 1",
    pulseDurationMs: 400,
    soundEnabled: true,
  });

  const [isRelayConnected, setIsRelayConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [relayTestPulse, setRelayTestPulse] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Camera scanner lifecycle
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const isProcessingRef = useRef(false);
  const barcodeBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);

  const [usbNotice, setUsbNotice] = useState<string | null>(null);

  // Connect USB Relay via Web Serial
  const handleConnectUsb = async () => {
    setUsbNotice(null);
    const res = await turnstileRelay.connectUsbRelay();
    if (res.success) {
      setIsRelayConnected(true);
      setUsbNotice("✓ Hardware USB relay connected successfully!");
      setTimeout(() => setUsbNotice(null), 4000);
    } else if (res.error) {
      setUsbNotice(res.error);
      setTimeout(() => setUsbNotice(null), 6000);
    }
  };

  // Disconnect USB Relay
  const handleDisconnectUsb = async () => {
    await turnstileRelay.disconnectUsbRelay();
    setIsRelayConnected(false);
    setUsbNotice("USB relay disconnected. Operating in Virtual Gate mode.");
    setTimeout(() => setUsbNotice(null), 4000);
  };

  // Test pulse physical relay
  const handleTestRelay = async () => {
    setRelayTestPulse(true);
    await turnstileRelay.pulseGateOpen(config);
    setTimeout(() => setRelayTestPulse(false), config.pulseDurationMs);
  };

  // Verify and process scanned pass
  const handleVerifyTicket = useCallback(
    async (rawCode: string) => {
      const cleanCode = rawCode.trim().toUpperCase();
      if (!cleanCode || isProcessingRef.current) return;
      isProcessingRef.current = true;

      setGateState("verifying");
      setAttendeeInfo(null);

      try {
        const res = await fetch(`/api/events/${event.id}/scan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId: cleanCode }),
        });

        const data = await res.json();

        if (res.ok) {
          // Positive verification -> Trigger Turnstile Relay Unlock!
          setCheckedInCount((c) => c + 1);
          setAttendeeInfo({
            name: data.attendeeName || "Verified Delegate",
            ticketName: data.ticketType || "General Admission",
            ticketCode: cleanCode,
            table: data.tableNumber || undefined,
            seat: data.seatNumber || undefined,
          });
          setGateState("unlocked");

          // Pulse physical relay hardware & chime
          await turnstileRelay.pulseGateOpen(config);

          // Reset gate to IDLE after 2.8 seconds
          setTimeout(() => {
            setGateState("idle");
            setAttendeeInfo(null);
            isProcessingRef.current = false;
          }, 2800);
        } else {
          // Negative verification -> Keep Gate Firmly Locked & Sound Buzzer!
          setAttendeeInfo({
            ticketCode: cleanCode,
            error: data.error || "Access Denied: Invalid Pass",
          });
          setGateState("denied");

          turnstileRelay.triggerAccessDenied(config);

          // Reset gate to IDLE after 3.2 seconds
          setTimeout(() => {
            setGateState("idle");
            setAttendeeInfo(null);
            isProcessingRef.current = false;
          }, 3200);
        }
      } catch (err) {
        // Fallback to Offline Local Gate Cache (Liveet-Style Venue Resilience)
        const offlineResult = offlineGateCache.verifyOffline(event.id, cleanCode);
        if (offlineResult.valid && offlineResult.attendee) {
          setCheckedInCount((c) => c + 1);
          setPendingOfflineCount(offlineGateCache.getPendingScans(event.id).length);
          setAttendeeInfo({
            name: offlineResult.attendee.name,
            ticketName: `${offlineResult.attendee.tier} • Offline Mode`,
            ticketCode: cleanCode,
            table: offlineResult.attendee.table || undefined,
            seat: offlineResult.attendee.seat || undefined,
          });
          setGateState("unlocked");
          await turnstileRelay.pulseGateOpen(config);

          setTimeout(() => {
            setGateState("idle");
            setAttendeeInfo(null);
            isProcessingRef.current = false;
          }, 2800);
          return;
        }

        setAttendeeInfo({
          ticketCode: cleanCode,
          error: offlineResult.error || "Network offline & pass not found in venue cache.",
        });
        setGateState("denied");
        turnstileRelay.triggerAccessDenied(config);

        setTimeout(() => {
          setGateState("idle");
          setAttendeeInfo(null);
          isProcessingRef.current = false;
        }, 3200);
      }
    },
    [event.id, config]
  );

  // Ref to verify handler to decouple camera lifecycle from state updates
  const handleVerifyTicketRef = useRef(handleVerifyTicket);
  handleVerifyTicketRef.current = handleVerifyTicket;

  // Direct Camera start/stop handlers
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!qrScannerRef.current) {
        qrScannerRef.current = new Html5Qrcode("turnstile-qr-reader");
      }
      if (qrScannerRef.current.isScanning) {
        setIsCameraActive(true);
        return;
      }
      await qrScannerRef.current.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          void handleVerifyTicketRef.current(decodedText);
        },
        () => {}
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn("Camera start warning:", err);
      setCameraError(err?.message || "Webcam access unavailable or permission blocked.");
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch {}
      setIsCameraActive(false);
    }
  }, []);

  // Initial offline pack fetch & sync listeners
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);
    setPendingOfflineCount(offlineGateCache.getPendingScans(event.id).length);

    // Download offline pack snapshot
    void offlineGateCache.refreshOfflinePack(event.id);

    const handleOnline = () => {
      setIsOnline(true);
      void offlineGateCache.syncPendingScans(event.id).then(() => {
        setPendingOfflineCount(offlineGateCache.getPendingScans(event.id).length);
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [event.id]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await offlineGateCache.syncPendingScans(event.id);
    setPendingOfflineCount(offlineGateCache.getPendingScans(event.id).length);
    setIsSyncing(false);
  };
  useEffect(() => {
    const timer = setTimeout(() => {
      void startCamera();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(() => {});
      }
    };
  }, [startCamera]);

  // Support for External USB Hardware Barcode Guns (Keyboard wedge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input element
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      const now = Date.now();
      // Fast keystroke interval typical of hardware barcode scanners (<100ms)
      if (now - lastKeyTimeRef.current > 100) {
        barcodeBufferRef.current = "";
      }
      lastKeyTimeRef.current = now;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.length >= 3) {
          const code = barcodeBufferRef.current;
          barcodeBufferRef.current = "";
          void handleVerifyTicket(code);
        }
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleVerifyTicket]);

  // Full-screen toggler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen transition-colors duration-300 flex flex-col justify-between selection:bg-brass selection:text-black",
        gateState === "unlocked"
          ? "bg-[#062d1c] text-white"
          : gateState === "denied"
          ? "bg-[#380e0e] text-white"
          : gateState === "verifying"
          ? "bg-[#0b1f33] text-white"
          : "bg-[#0a0d0c] text-white"
      )}
    >
      {/* Top Bar: Gate Status & Hardware Badges */}
      <header className="sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio
              className={cn(
                "h-4 w-4 animate-pulse",
                gateState === "unlocked"
                  ? "text-emerald-400"
                  : gateState === "denied"
                  ? "text-red-400"
                  : "text-brass-light"
              )}
            />
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-white/90">
              {config.gateName}
            </span>
          </div>
          <span className="text-white/20">|</span>
          <span className="text-xs text-white/60 truncate max-w-xs">{event.title}</span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Offline/Online Status Badge */}
          {isOnline ? (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              title="Venue internet active • Database live"
            >
              <Wifi size={12} className="text-emerald-400" />
              <span>Live Mesh</span>
            </span>
          ) : (
            <span
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border border-amber-500/40 bg-amber-500/15 text-amber-300 animate-pulse"
              title="Venue internet offline • Operating on cached database"
            >
              <WifiOff size={12} className="text-amber-400" />
              <span>Offline Mode</span>
            </span>
          )}

          {pendingOfflineCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border border-brass-light/40 bg-brass-light/20 text-brass-light hover:bg-brass-light/30 transition-all cursor-pointer"
              title="Click to sync pending offline scans to server"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              <span>{pendingOfflineCount} Queued</span>
            </button>
          )}

          {/* USB Relay Status Badge */}
          <button
            onClick={isRelayConnected ? handleDisconnectUsb : handleConnectUsb}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer",
              isRelayConnected
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            )}
            title={isRelayConnected ? "Click to disconnect USB relay" : "Click to connect USB relay via Web Serial"}
          >
            <Usb size={13} className={isRelayConnected ? "text-emerald-400" : ""} />
            <span>{isRelayConnected ? "Relay: Active" : "Connect USB Relay"}</span>
          </button>

          {/* Quick Hardware Pulse Test */}
          <button
            onClick={handleTestRelay}
            disabled={relayTestPulse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-brass-light/30 bg-brass-light/10 text-brass-light hover:bg-brass-light/20 transition-all cursor-pointer"
            title="Click to test physical turnstile unlock pulse"
          >
            <Zap size={13} className={relayTestPulse ? "animate-spin" : ""} />
            <span>{relayTestPulse ? "Pulsing..." : "Test Pulse"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setConfig((c) => ({ ...c, soundEnabled: !c.soundEnabled }))}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title={config.soundEnabled ? "Mute audio chimes" : "Enable audio chimes"}
          >
            {config.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Full Screen */}
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Toggle full screen kiosk"
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Turnstile & Gate Settings"
          >
            <Sliders size={16} />
          </button>
        </div>
      </header>

      {/* Non-intrusive notification toast */}
      {usbNotice && (
        <div className="mx-auto mt-3 max-w-lg px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-xs font-mono text-white/90 text-center shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          {usbNotice}
        </div>
      )}

      {/* Main Dynamic Turnstile Gate Display */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
        {gateState === "unlocked" ? (
          /* ================= POSITIVE UNLOCK STATE ================= */
          <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <div className="h-28 w-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_80px_rgba(16,185,129,0.4)]">
              <Unlock size={56} className="text-emerald-300 animate-pulse" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-emerald-300 font-bold px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 mb-3">
              ACCESS GRANTED • GATE UNLOCKED
            </span>

            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {attendeeInfo?.name}
            </h1>

            <p className="mt-2 text-xl text-emerald-200 font-medium">
              {attendeeInfo?.ticketName}
            </p>

            {/* Table & Seating Assignment Badge (Critical for Banquets, Dinners & Weddings) */}
            {attendeeInfo?.table && (
              <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-brass-light/20 border border-brass-light/40 text-brass-light text-base font-semibold shadow-lg">
                <Utensils size={16} />
                <span>{attendeeInfo.table}</span>
                {attendeeInfo.seat && <span>• Seat {attendeeInfo.seat}</span>}
              </div>
            )}

            <div className="mt-8 flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
              <Zap size={18} className="text-emerald-400 animate-bounce" />
              <span>PLEASE WALK THROUGH THE TURNSTILE</span>
            </div>
          </div>
        ) : gateState === "denied" ? (
          /* ================= NEGATIVE DENIED STATE ================= */
          <div className="animate-in zoom-in-95 duration-200 flex flex-col items-center">
            <div className="h-28 w-28 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-6 shadow-[0_0_80px_rgba(239,68,68,0.45)]">
              <Lock size={56} className="text-red-400" />
            </div>

            <span className="font-mono text-xs uppercase tracking-widest text-red-300 font-bold px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 mb-3">
              ACCESS DENIED • GATE LOCKED
            </span>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              {attendeeInfo?.error || "Pass Not Verified"}
            </h1>

            <p className="mt-3 text-sm text-red-300/80 max-w-md">
              The turnstile remains locked. Please step to the front desk help desk for assistance.
            </p>

            <div className="mt-8 px-6 py-3 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-mono">
              Code: {attendeeInfo?.ticketCode}
            </div>
          </div>
        ) : gateState === "verifying" ? (
          /* ================= VERIFYING STATE ================= */
          <div className="flex flex-col items-center">
            <RefreshCw size={48} className="animate-spin text-brass-light mb-4" />
            <h2 className="font-display text-2xl font-semibold text-white">Verifying Pass...</h2>
            <p className="mt-1 text-sm text-white/50">Querying security database in &lt;50ms</p>
          </div>
        ) : (
          /* ================= IDLE / WAITING STATE ================= */
          <div className="flex flex-col items-center w-full">
            <div className="mb-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-brass-light font-mono font-medium">
              <QrCode size={14} />
              <span>PRESENT PASS QR CODE BELOW OR ON SCANNER</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-semibold text-white tracking-tight">
              Ready for Next Attendee
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Hold your Selah digital pass or printed badge up to the turnstile reader.
            </p>

            {/* Embedded Optical Scanner Box */}
            <div className="mt-6 w-full max-w-sm rounded-3xl border border-white/15 bg-black/60 p-4 shadow-2xl relative overflow-hidden">
              <div className="aspect-square w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 flex items-center justify-center relative">
                <div
                  id="turnstile-qr-reader"
                  className="w-full h-full text-white overflow-hidden flex items-center justify-center [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                ></div>

                {/* Overlay when camera is inactive */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 z-10">
                    <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-brass-light">
                      <Camera size={26} />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">Optical Camera Scanner</p>
                    <p className="text-xs text-white/50 mb-4 max-w-[220px]">
                      {cameraError ? "Camera permissions required or no webcam detected." : "Click below to activate camera or use hardware USB gun."}
                    </p>
                    <button
                      onClick={startCamera}
                      type="button"
                      className="btn btn-brass text-xs py-2 px-4 shadow-lg flex items-center gap-2 cursor-pointer"
                    >
                      <Camera size={14} /> Start Camera Stream
                    </button>
                  </div>
                )}

                {/* Visual reticle overlay (active when scanning) */}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 border-2 border-brass-light/40 rounded-2xl m-6 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-brass-light/80 animate-pulse shadow-[0_0_14px_#c08a2e]" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[0.65rem] text-emerald-300 font-mono">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>LIVE</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Code Input & On-Screen Keyboard Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualCode) {
                  void handleVerifyTicket(manualCode);
                  setManualCode("");
                }
              }}
              className="mt-6 flex flex-col items-center gap-3 max-w-sm w-full"
            >
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter code (e.g. DEMO-PASS or ticket code)..."
                  className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-white/40 focus:border-brass-light focus:bg-white/15 focus:outline-none flex-1 text-center tracking-wider"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="btn btn-brass py-2.5 px-4 text-xs font-semibold shrink-0 disabled:opacity-40 cursor-pointer"
                >
                  Unlock Gate
                </button>
              </div>

              {/* Instant Simulation Buttons for Testing Without Physical Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[0.75rem]">
                <span className="text-white/40 font-mono">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => void handleVerifyTicket("DEMO-PASS")}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-colors font-mono cursor-pointer"
                  title="Simulate scanning a valid attendee pass (safe test)"
                >
                  ✓ Valid Pass (Unlock)
                </button>
                <button
                  type="button"
                  onClick={() => void handleVerifyTicket("DEMO-DENIED")}
                  className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 transition-colors font-mono cursor-pointer"
                  title="Simulate scanning an invalid or cancelled pass"
                >
                  ✗ Denied Pass (Locked)
                </button>
                {sampleRealTicket && (
                  <button
                    type="button"
                    onClick={() => void handleVerifyTicket(sampleRealTicket.code)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-brass-light hover:bg-white/15 transition-colors font-mono cursor-pointer"
                    title={`Real attendee: ${sampleRealTicket.name}`}
                  >
                    Real Pass: {sampleRealTicket.code}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Bottom Footer Statistics */}
      <footer className="px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between text-xs text-white/60">
        <div className="flex items-center gap-4">
          <span>Checked In at Entrance: <strong className="text-white font-mono">{checkedInCount}</strong></span>
        </div>
        <div className="font-mono text-[0.7rem] text-white/40">
          Selah Access Controller v2.4 • Web Serial &amp; Relay Supported
        </div>
      </footer>

      {/* Hardware Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#121614] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-brass-light" />
                <h3 className="font-display text-lg font-semibold text-white">Turnstile &amp; Relay Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-white/80 mb-1">Gate Name / Lane Identifier</label>
                <input
                  type="text"
                  value={config.gateName}
                  onChange={(e) => setConfig((c) => ({ ...c, gateName: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white font-mono"
                  placeholder="e.g. Turnstile Lane 1"
                />
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">
                  Relay Unlock Pulse: <span className="text-brass-light font-mono">{config.pulseDurationMs}ms</span>
                </label>
                <input
                  type="range"
                  min="200"
                  max="1200"
                  step="50"
                  value={config.pulseDurationMs}
                  onChange={(e) => setConfig((c) => ({ ...c, pulseDurationMs: parseInt(e.target.value, 10) }))}
                  className="w-full accent-[var(--color-brass)] cursor-pointer"
                />
                <span className="text-[0.65rem] text-white/40">300ms–500ms is standard for tripod and optical turnstiles.</span>
              </div>

              <div>
                <label className="block font-semibold text-white/80 mb-1">Optional Network IP Relay URL (Ethernet)</label>
                <input
                  type="text"
                  value={config.ipRelayUrl || ""}
                  onChange={(e) => setConfig((c) => ({ ...c, ipRelayUrl: e.target.value }))}
                  className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white font-mono text-[0.75rem]"
                  placeholder="e.g. http://192.168.1.120/relay/open"
                />
              </div>

              {/* Hardware Test Block */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <span className="font-semibold text-white/90 block">Hardware Diagnostic:</span>
                <div className="flex items-center justify-between">
                  <span>USB Serial Driver:</span>
                  <span className={cn("font-mono font-bold", isRelayConnected ? "text-emerald-400" : "text-white/40")}>
                    {isRelayConnected ? "CONNECTED" : "NOT CONNECTED"}
                  </span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestRelay}
                    disabled={relayTestPulse}
                    className="btn btn-primary !py-2 !text-xs w-full justify-center cursor-pointer"
                  >
                    {relayTestPulse ? "Relay Pulsing (Click!)..." : "Test Physical Relay Click"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="btn btn-light !py-2 !text-xs cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
