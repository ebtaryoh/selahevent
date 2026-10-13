"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, X, Share2, PlusSquare, Sparkles, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // default true until verified
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Register service worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[selah-pwa] Service worker registered:", reg.scope))
        .catch((err) => console.warn("[selah-pwa] SW registration failed:", err));
    } else if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. Check if already installed
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS standalone property
      Boolean(window.navigator.standalone);

    setIsStandalone(isStandaloneMode);

    // 3. Check dismissed cache
    const dismissedUntil = localStorage.getItem("selah_pwa_dismissed_until");
    const isSnoozed = dismissedUntil && Number(dismissedUntil) > Date.now();

    // 4. Check if iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      // @ts-expect-error MSStream property check
      !window.MSStream;
    setIsIos(isIosDevice);

    if (!isStandaloneMode && !isSnoozed) {
      setIsDismissed(false);
    }

    // 5. Android/Desktop beforeinstallprompt listener
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isSnoozed && !isStandaloneMode) {
        setIsDismissed(false);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsStandalone(true);
      setIsDismissed(true);
      setInstalledSuccess(true);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsDismissed(true);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIosGuide(false);
    // Snooze for 7 days
    localStorage.setItem(
      "selah_pwa_dismissed_until",
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom App Install Card */}
      <aside
        aria-label="Install Selah Mobile App"
        className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md sm:bottom-6 sm:right-6 sm:left-auto"
      >
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(192,138,46,0.35)] bg-[#121417]/95 p-4 shadow-2xl backdrop-blur-xl transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-brass/40 bg-[#0e2a22] p-2 flex items-center justify-center shadow-md">
                <Image
                  src="/icons/icon.svg"
                  alt="Selah icon"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-ink">
                    Install Selah on Your Phone
                  </h4>
                  <span className="rounded bg-brass/20 px-1.5 py-0.2 text-[0.62rem] font-bold text-brass uppercase">
                    App
                  </span>
                </div>
                <p className="mt-0.5 text-[0.735rem] leading-tight text-warm-500">
                  Instant daily morning prayers & offline gate entrance tickets.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="text-warm-500 hover:text-ink cursor-pointer p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-2.5 py-1.5 text-xs text-warm-500 hover:text-warm-300 transition-colors"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn btn-brass !py-1.5 !px-3.5 !text-xs font-semibold cursor-pointer shadow-md shadow-brass/20 flex items-center gap-1.5"
            >
              <Download size={13} /> Install App
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/15 bg-[#121417] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brass" />
                <h4 className="font-semibold text-ink text-sm">
                  Add Selah to iPhone / iPad
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-warm-500 hover:text-ink p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-warm-500 leading-relaxed">
              Apple Safari lets you install Selah directly onto your home screen without the App Store:
            </p>

            <ol className="space-y-3 text-xs text-warm-400">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass font-bold text-[0.65rem]">
                  1
                </span>
                <span>
                  Tap the <strong className="text-ink">Share icon</strong> (<Share2 size={13} className="inline text-brass" />) at the bottom toolbar of Safari.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass font-bold text-[0.65rem]">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-ink">Add to Home Screen</strong> (<PlusSquare size={13} className="inline text-brass" />).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass/20 text-brass font-bold text-[0.65rem]">
                  3
                </span>
                <span>
                  Tap <strong className="text-ink">Add</strong> in the top right corner. Selah will now sit on your home screen like any native app!
                </span>
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="btn btn-secondary w-full !py-2 !text-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
