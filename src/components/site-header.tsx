"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SelahWordmark } from "@/components/logo";
import { cn } from "@/lib/format";

const links = [
  { href: "/", label: "Discover Events" },
  { href: "#", label: "For Churches" },
  { href: "#", label: "Pricing" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-[rgba(22,19,17,0.09)] bg-[rgba(247,243,236,0.88)] backdrop-blur-xl"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Selah home" className="shrink-0">
          <SelahWordmark markSize="h-8 w-8" />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="relative text-[0.875rem] font-medium text-warm-600 transition-colors hover:text-ink after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-[var(--color-brass)] after:transition-[width] after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="text-[0.875rem] font-semibold text-ink transition-colors hover:text-[var(--color-brass-deep)]"
          >
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary !px-5 !py-3 !text-[0.85rem]">
            Host an Event
            <ArrowUpRight size={16} strokeWidth={2.2} />
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(22,19,17,0.14)] text-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 top-[72px] bg-parchment px-5 pt-6 pb-10 lg:hidden"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display border-b border-[rgba(22,19,17,0.09)] py-4 text-[1.35rem] font-semibold text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="btn btn-primary w-full"
              >
                Host an Event
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn btn-ghost w-full"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
