export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

const CURRENCY_LOCALE: Record<string, string> = {
  NGN: "en-NG",
  GHS: "en-GH",
  KES: "en-KE",
  ZAR: "en-ZA",
  USD: "en-US",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
};

export function formatMoney(amount: number | null | undefined, currency = "NGN", minor = false) {
  const num = typeof amount === "number" && !Number.isNaN(amount) ? amount : (Number(amount) || 0);
  const value = minor ? num / 100 : num;
  const curr = (currency && typeof currency === "string" && currency.trim()) ? currency.trim().toUpperCase() : "NGN";
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[curr] ?? "en-US", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${curr} ${Number(value).toLocaleString()}`;
  }
}

export function formatNumber(value: number | null | undefined) {
  const num = typeof value === "number" && !Number.isNaN(value) ? value : (Number(value) || 0);
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  }
) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", opts).format(d);
  } catch {
    return "—";
  }
}

export function formatTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return "—";
  }
}

export function formatRange(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  if (!start && !end) return "—";
  if (!start) return formatDate(end);
  if (!end) return formatDate(start);
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const sValid = s instanceof Date && !Number.isNaN(s.getTime());
  const eValid = e instanceof Date && !Number.isNaN(e.getTime());
  if (!sValid && !eValid) return "—";
  if (!sValid) return formatDate(e);
  if (!eValid) return formatDate(s);

  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const left = formatDate(s, {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric",
  } as Intl.DateTimeFormatOptions);
  const right = formatDate(e, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `${left} – ${right}`;
}

export function relativeDays(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return "—";
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function timeUntil(target: Date | string | null | undefined) {
  if (!target) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const d = typeof target === "string" ? new Date(target) : target;
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  const ms = d.getTime() - Date.now();
  const clamped = Math.max(ms, 0);
  return {
    passed: ms <= 0,
    days: Math.floor(clamped / 86_400_000),
    hours: Math.floor((clamped % 86_400_000) / 3_600_000),
    minutes: Math.floor((clamped % 3_600_000) / 60_000),
    seconds: Math.floor((clamped % 60_000) / 1000),
    total: clamped,
  };
}

export function percent(part: number | null | undefined, whole: number | null | undefined) {
  const p = Number(part) || 0;
  const w = Number(whole) || 0;
  if (!w) return 0;
  return Math.min(100, Math.round((p / w) * 100));
}

export function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Deterministic pseudo-random helper used for stable decorative variation. */
export function seededHue(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

/** Parses standard YouTube/Vimeo URLs into their embed equivalents */
export function parseVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    
    // YouTube
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      let videoId = "";
      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.slice(1);
      } else if (parsed.searchParams.has("v")) {
        videoId = parsed.searchParams.get("v")!;
      } else if (parsed.pathname.startsWith("/embed/")) {
        return url; // Already an embed URL
      }
      
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      }
    }
    
    // Vimeo
    if (parsed.hostname.includes("vimeo.com")) {
      const match = parsed.pathname.match(/^\/(\d+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}?color=c08a2e&title=0&byline=0&portrait=0`;
      }
    }
  } catch (e) {
    // Invalid URL
  }
  
  return null;
}

export function getRequestOrigin(request?: Request): string {
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    if (host && !host.includes("localhost")) {
      return `${proto}://${host}`;
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !envUrl.includes("localhost")) {
    return envUrl;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NODE_ENV === "production"
    ? "https://selahevent.vercel.app"
    : (envUrl || "http://localhost:3000");
}
