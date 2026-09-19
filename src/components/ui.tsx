"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/format";

export function Reveal({
  children,
  delay = 0,
  y = 20,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: reduce ? 0.01 : 0.58,
        delay: reduce ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}

export function CountUp({
  value,
  duration = 1100,
  suffix = "",
  prefix = "",
  className,
  format = true,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  format?: boolean;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || started.current) return;
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          setDisplay(Math.round(value * eased));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, duration, reduce]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {prefix}
      {format ? display.toLocaleString() : display}
      {suffix}
    </span>
  );
}

export function SectionHead({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        tone === "light" ? "text-paper" : "text-ink"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" && "justify-center"
        )}
      >
        {index ? (
          <span
            className="font-display text-sm font-semibold tabular-nums"
            style={{ color: "var(--color-brass)" }}
          >
            {index}
          </span>
        ) : null}
        <span
          className="eyebrow"
          style={{
            color:
              tone === "light"
                ? "rgba(232,211,166,0.9)"
                : "var(--color-brass-deep)",
          }}
        >
          {eyebrow}
        </span>
      </div>
      <div
        className="mt-3 h-px w-full max-w-[9rem]"
        style={{
          background:
            tone === "light"
              ? "rgba(232,211,166,0.4)"
              : "rgba(192,138,46,0.5)",
        }}
      />
      <h2
        className="font-display mt-5 text-[clamp(1.95rem,4.4vw,3.15rem)] leading-[1.08] font-semibold"
        style={{ color: tone === "light" ? "#f7f3ec" : "var(--color-ink)" }}
      >
        {title}
      </h2>
      {description ? (
        <div
          className={cn(
            "mt-4 text-[1.02rem] leading-[1.72]",
            tone === "light" ? "text-[rgba(247,243,236,0.76)]" : "text-warm-600"
          )}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function StatBlock({
  label,
  value,
  detail,
  tone = "light",
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div>
      <div
        className="eyebrow"
        style={{
          color:
            tone === "light" ? "rgba(247,243,236,0.62)" : "var(--color-warm-400)",
        }}
      >
        {label}
      </div>
      <div
        className="font-display tnum mt-2 text-[clamp(1.9rem,3.6vw,2.75rem)] leading-none font-semibold"
        style={{ color: tone === "light" ? "#f7f3ec" : "var(--color-ink)" }}
      >
        {value}
      </div>
      {detail ? (
        <div
          className="mt-2 text-[0.82rem] leading-relaxed"
          style={{
            color:
              tone === "light" ? "rgba(247,243,236,0.62)" : "var(--color-warm-400)",
          }}
        >
          {detail}
        </div>
      ) : null}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "brass",
}: {
  value: number;
  tone?: "brass" | "green" | "red";
}) {
  const color =
    tone === "green"
      ? "var(--color-signal-green)"
      : tone === "red"
        ? "var(--color-signal-red)"
        : "var(--color-brass)";
  return (
    <div
      className="h-[6px] w-full overflow-hidden rounded-full"
      style={{ background: "rgba(22,19,17,0.09)" }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${Math.max(2, Math.min(100, value))}%`,
          background: `linear-gradient(90deg, ${color}, var(--color-brass-light))`,
        }}
      />
    </div>
  );
}
