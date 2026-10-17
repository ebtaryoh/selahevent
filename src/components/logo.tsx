export function SelahMark({
  className = "h-9 w-9",
  tone,
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  const isExplicitLight = tone === "light";
  const body = isExplicitLight ? "#ffffff" : "#161618";
  const accent = isExplicitLight ? "#e8d3a6" : "#c08a2e";

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Selah"
      fill="none"
    >
      {/* Sanctuary arch */}
      <path
        d="M24 2.5c10.6 0 19.2 8.6 19.2 19.2V41a4.5 4.5 0 0 1-4.5 4.5H9.3A4.5 4.5 0 0 1 4.8 41V21.7C4.8 11.1 13.4 2.5 24 2.5Z"
        fill={body}
        className="dark:fill-[#161618] fill-[#141210]"
      />
      {/* Inner light arch */}
      <path
        d="M24 12.2c5.7 0 10.3 4.6 10.3 10.3v17.1a1.1 1.1 0 0 1-1.1 1.1H14.8a1.1 1.1 0 0 1-1.1-1.1V22.5c0-5.7 4.6-10.3 10.3-10.3Z"
        fill={accent}
        className="dark:fill-[#e2c073] fill-[#b88628]"
        opacity="0.95"
      />
      {/* Page rule — the "programme" line */}
      <path
        d="M17.6 30.6h12.8M17.6 35.1h8.4"
        stroke={body}
        className="dark:stroke-[#161618] stroke-[#141210]"
        strokeWidth="2.4"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Radiant dot */}
      <circle cx="24" cy="21.6" r="3.2" fill={body} className="dark:fill-[#161618] fill-[#141210]" opacity="0.92" />
    </svg>
  );
}

export function SelahWordmark({
  tone,
  className = "",
  markSize = "h-9 w-9",
}: {
  tone?: "dark" | "light";
  className?: string;
  markSize?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SelahMark tone={tone} className={markSize} />
      <span className="leading-none">
        <span className="font-display block text-[1.32rem] font-semibold tracking-[-0.02em] text-ink">
          Selah
        </span>
        <span className="eyebrow block text-[0.52rem] font-bold text-brass-deep dark:text-brass tracking-[0.28em] uppercase">
          Event OS
        </span>
      </span>
    </span>
  );
}
