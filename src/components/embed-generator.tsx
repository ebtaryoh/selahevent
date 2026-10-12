"use client";

import { useState, useMemo } from "react";
import { Check, Copy, ExternalLink, Globe, Monitor, Smartphone, Code2, Sparkles, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

type EmbedTab = "button" | "iframe" | "popup";
type ButtonTheme = "brass" | "cypress" | "white" | "minimal";

interface EmbedGeneratorProps {
  event: {
    id: string;
    title: string;
    slug: string;
    city: string;
    brandColor?: string | null;
  };
  tickets: Array<{
    id: string;
    name: string;
    price: number | string;
    currency: string;
  }>;
}

export function EmbedGenerator({ event, tickets }: EmbedGeneratorProps) {
  const [activeTab, setActiveTab] = useState<EmbedTab>("button");
  const [buttonText, setButtonText] = useState("Register on Selah");
  const [buttonTheme, setButtonTheme] = useState<ButtonTheme>("brass");
  const [selectedTicketId, setSelectedTicketId] = useState<string>("all");
  const [iframeHeight, setIframeHeight] = useState("800");
  const [copied, setCopied] = useState(false);

  // Determine origin safely (defaults to window.location.origin on client)
  const origin = typeof window !== "undefined" ? window.location.origin : "https://selahevent.com";

  const targetUrl = useMemo(() => {
    const base = `${origin}/e/${event.slug}/register`;
    const params = new URLSearchParams();
    if (selectedTicketId !== "all") {
      params.set("ticket", selectedTicketId);
    }
    if (activeTab === "iframe") {
      params.set("embed", "true");
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [origin, event.slug, selectedTicketId, activeTab]);

  const eventUrl = `${origin}/e/${event.slug}`;

  // Generate code snippets
  const generatedCode = useMemo(() => {
    if (activeTab === "button") {
      let bg = "#c08a2e";
      let color = "#ffffff";
      let border = "none";
      let shadow = "0 4px 14px rgba(192, 138, 46, 0.35)";

      if (buttonTheme === "cypress") {
        bg = "#0e2a22";
        color = "#f7f3ec";
        shadow = "0 4px 14px rgba(14, 42, 34, 0.35)";
      } else if (buttonTheme === "white") {
        bg = "#ffffff";
        color = "#161311";
        border = "1px solid rgba(22, 19, 17, 0.15)";
        shadow = "0 2px 8px rgba(0, 0, 0, 0.06)";
      } else if (buttonTheme === "minimal") {
        bg = "transparent";
        color = "#c08a2e";
        border = "2px solid #c08a2e";
        shadow = "none";
      }

      return `<!-- Selah Registration Button -->
<a 
  href="${targetUrl}"
  target="_blank"
  rel="noopener noreferrer"
  style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: ${bg};
    color: ${color};
    border: ${border};
    padding: 13px 26px;
    font-size: 15px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 10px;
    text-decoration: none;
    box-shadow: ${shadow};
    transition: transform 0.15s ease, opacity 0.15s ease;
  "
  onmouseover="this.style.opacity='0.92'"
  onmouseout="this.style.opacity='1'"
>
  <span>${buttonText}</span>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
</a>`;
    }

    if (activeTab === "iframe") {
      return `<!-- Selah Embedded Registration Form -->
<div style="max-width: 840px; margin: 0 auto; width: 100%;">
  <iframe 
    src="${targetUrl}"
    width="100%" 
    height="${iframeHeight}" 
    frameborder="0"
    style="
      border: 1px solid rgba(22, 19, 17, 0.08); 
      border-radius: 16px; 
      overflow: hidden; 
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    "
    allow="payment"
    loading="lazy"
  ></iframe>
</div>`;
    }

    if (activeTab === "popup") {
      return `<!-- Selah Modal Trigger Script -->
<button 
  id="selah-open-btn"
  style="
    background: #0e2a22;
    color: #e8d3a6;
    border: 1px solid rgba(232, 211, 166, 0.4);
    padding: 14px 28px;
    font-size: 15px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(14, 42, 34, 0.4);
  "
>
  ${buttonText}
</button>

<div id="selah-modal" style="display:none; position:fixed; inset:0; z-index:999999; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); align-items:center; justify-content:center; padding:16px;">
  <div style="position:relative; width:100%; max-width:820px; height:85vh; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.3);">
    <button id="selah-close-btn" style="position:absolute; top:14px; right:16px; z-index:10; background:#fff; border:1px solid #ddd; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:16px; font-weight:bold;">×</button>
    <iframe src="${targetUrl}" style="width:100%; height:100%; border:none;" allow="payment"></iframe>
  </div>
</div>

<script>
  document.getElementById('selah-open-btn').addEventListener('click', function() {
    document.getElementById('selah-modal').style.display = 'flex';
  });
  document.getElementById('selah-close-btn').addEventListener('click', function() {
    document.getElementById('selah-modal').style.display = 'none';
  });
</script>`;
    }

    return "";
  }, [activeTab, targetUrl, buttonText, buttonTheme, iframeHeight]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="space-y-8">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-4">
        {[
          { id: "button", label: "Direct Action Button", icon: Globe, desc: "Lightweight button linking directly to checkout" },
          { id: "iframe", label: "Embedded Form (iFrame)", icon: Monitor, desc: "Inline checkout inside church page" },
          { id: "popup", label: "Popup Modal Widget", icon: Layers, desc: "Opens registration inside an overlay modal" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EmbedTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all",
                isSelected
                  ? "bg-ink text-white shadow-sm"
                  : "bg-paper text-warm-600 hover:text-ink hover:bg-black/5"
              )}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Customization Controls (Left Column) */}
        <div className="lg:col-span-5 space-y-6 rounded-2xl border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-brass)]" />
            <span>Customize Widget</span>
          </h2>

          {activeTab !== "iframe" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-warm-700">
                Button Label
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="e.g., Register on Selah"
                className="input text-xs sm:text-sm !py-2.5"
              />
            </div>
          )}

          {activeTab === "button" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-warm-700">
                Visual Theme
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "brass", label: "Selah Gold", desc: "Warm gold accent" },
                  { id: "cypress", label: "Church Forest", desc: "Deep cypress green" },
                  { id: "white", label: "Classic White", desc: "Clean border card" },
                  { id: "minimal", label: "Gold Outline", desc: "Minimal border" },
                ].map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setButtonTheme(th.id as ButtonTheme)}
                    className={cn(
                      "flex flex-col text-left p-3 rounded-xl border text-xs transition-all",
                      buttonTheme === th.id
                        ? "border-[var(--color-brass)] bg-[rgba(226,192,115,0.1)] font-semibold text-ink ring-1 ring-[var(--color-brass)]"
                        : "border-black/10 bg-white/60 text-warm-600 hover:border-warm-300"
                    )}
                  >
                    <span>{th.label}</span>
                    <span className="text-[0.65rem] text-warm-400 mt-0.5">{th.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === "iframe" && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-warm-700">
                Embed Height (Pixels)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="600"
                  max="1400"
                  step="50"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(e.target.value)}
                  className="input text-xs sm:text-sm !py-2.5 w-32"
                />
                <span className="text-xs text-warm-500">pixels (800px recommended)</span>
              </div>
            </div>
          )}

          {tickets.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-warm-700">
                Target Ticket Pass
              </label>
              <select
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                className="input text-xs sm:text-sm !py-2.5"
              >
                <option value="all">All Passes (Let attendee choose in step 1)</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {Number(t.price) === 0 ? "Free" : `${t.currency} ${Number(t.price).toLocaleString()}`}
                  </option>
                ))}
              </select>
              <p className="text-[0.7rem] text-warm-500">
                You can generate individual buttons for specific passes (e.g. "VIP Pastors Pass").
              </p>
            </div>
          )}

          {/* Integration Guide Note */}
          <div className="rounded-xl border border-black/10 bg-warm-50/70 p-4 text-xs text-warm-700 space-y-1.5">
            <span className="font-semibold text-ink block">Where to paste this code:</span>
            <ul className="list-disc list-inside space-y-1 text-warm-600">
              <li><strong className="text-ink">WordPress:</strong> Add a “Custom HTML” block and paste.</li>
              <li><strong className="text-ink">Squarespace:</strong> Add a “Code” or “Embed” block.</li>
              <li><strong className="text-ink">Wix:</strong> Add an “HTML Embed” element.</li>
              <li><strong className="text-ink">Custom HTML:</strong> Paste directly into your template.</li>
            </ul>
          </div>
        </div>

        {/* Live Preview & Generated Code (Right Column) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Preview Box */}
          <div className="rounded-2xl border border-[rgba(22,19,17,0.1)] bg-paper p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warm-500">
                <Monitor className="h-4 w-4 text-[var(--color-brass)]" />
                <span>Live Website Preview</span>
              </div>
              <span className="text-[0.7rem] text-warm-400">Interactive</span>
            </div>

            <div className="rounded-xl border border-dashed border-warm-300 bg-warm-50/50 p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
              {activeTab === "button" ? (
                <div>
                  <div
                    dangerouslySetInnerHTML={{ __html: generatedCode.replace(/<!--[\s\S]*?-->/, "") }}
                  />
                  <p className="mt-4 text-[0.7rem] text-warm-500">
                    Clicking this button in production opens: <br />
                    <code className="text-[0.65rem] text-ink bg-white px-2 py-0.5 rounded border border-black/10 font-mono mt-1 inline-block">
                      {targetUrl}
                    </code>
                  </p>
                </div>
              ) : activeTab === "iframe" ? (
                <div className="w-full">
                  <div className="text-xs font-medium text-warm-600 mb-3">
                    Embedded Registration Box ({iframeHeight}px height):
                  </div>
                  <div className="w-full h-44 rounded-xl border border-black/15 bg-white p-4 flex flex-col items-center justify-center shadow-inner text-xs text-warm-500">
                    <Monitor size={24} className="text-warm-400 mb-2" />
                    <span>Inline Checkout will render here directly on your church domain.</span>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--color-brass)] font-semibold hover:underline"
                    >
                      <span>Open target URL in new tab</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => window.open(targetUrl, "_blank")}
                  >
                    {buttonText} (Demo Modal Trigger)
                  </button>
                  <p className="mt-3 text-[0.7rem] text-warm-500">
                    Triggers a pop-up dialog directly above your church webpage.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Code Output Box */}
          <div className="rounded-2xl border border-[rgba(22,19,17,0.1)] bg-[#0d1311] p-6 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs text-brass-light">
                <Code2 size={16} />
                <span>HTML Code Snippet</span>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <pre className="overflow-x-auto text-xs text-[rgba(247,243,236,0.85)] font-mono p-4 rounded-xl bg-black/40 border border-white/5 leading-relaxed max-h-72">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
