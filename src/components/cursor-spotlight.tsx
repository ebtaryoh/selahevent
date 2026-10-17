"use client";

import { useEffect, useRef, useState } from "react";

export function CursorSpotlight() {
  const [visible, setVisible] = useState(false);
  const posRef = useRef({ x: -1000, y: -1000 });
  const currentPosRef = useRef({ x: -1000, y: -1000 });
  const spotRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if pointer device supports fine movement
    const mediaQuery = window.matchMedia("(pointer: fine)");
    if (!mediaQuery.matches) return;

    const handlePointerMove = (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };

    const handlePointerLeave = () => {
      setVisible(false);
    };

    const handlePointerEnter = () => {
      setVisible(true);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("mouseleave", handlePointerLeave);
    document.addEventListener("mouseenter", handlePointerEnter);

    // Smooth animation loop using lerp for sacred fluid trailing light
    const animate = () => {
      const target = posRef.current;
      const current = currentPosRef.current;

      current.x += (target.x - current.x) * 0.18;
      current.y += (target.y - current.y) * 0.18;

      if (spotRef.current) {
        spotRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("mouseleave", handlePointerLeave);
      document.removeEventListener("mouseenter", handlePointerEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        ref={spotRef}
        className="absolute -top-[350px] -left-[350px] h-[700px] w-[700px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle closest-side, var(--spotlight-glow, rgba(226, 192, 115, 0.08)), rgba(226, 192, 115, 0.03) 40%, transparent 80%)",
          filter: "blur(40px)",
        }}
      />
      {/* Intense inner divine spark center */}
      <div
        className="absolute -top-[75px] -left-[75px] h-[150px] w-[150px] rounded-full will-change-transform opacity-60"
        style={{
          transform: spotRef.current?.style.transform,
          background:
            "radial-gradient(circle closest-side, rgba(252, 238, 197, 0.12), transparent 75%)",
          filter: "blur(15px)",
        }}
      />
    </div>
  );
}
