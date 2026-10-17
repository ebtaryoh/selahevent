"use client";

import { ArrowUpRight, Menu, X, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SelahWordmark } from "@/components/logo";
import { cn } from "@/lib/format";
import { ThemeToggle } from "@/components/theme-provider";

const links = [
  { href: "/", label: "Discover Events" },
  { href: "/my-tickets", label: "Find My Pass" },
  { href: "/sanctuary", label: "Daily Sanctuary" },
  { href: "/for-ministries", label: "For Ministries" },
  { href: "/#lifecycle", label: "How it works" },
];

export function SiteHeader({ isSignedIn = false }: { isSignedIn?: boolean }) {
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
          ? "border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-xl shadow-sm"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Selah home" className="shrink-0">
          <SelahWordmark markSize="h-8 w-8" />
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
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
          <ThemeToggle />
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="text-[0.875rem] font-semibold text-ink transition-colors hover:text-brass"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-[0.875rem] font-semibold text-ink transition-colors hover:text-brass"
            >
              Sign in
            </Link>
          )}
          <Link href={isSignedIn ? "/dashboard/events/new" : "/register"} className="btn btn-brass !px-5 !py-2.5 !text-[0.85rem] font-bold shadow-md">
            Host an Event
            <ArrowUpRight size={15} strokeWidth={2.4} />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-brass/20 text-ink bg-brass/5"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 top-[72px] bg-parchment px-5 pt-6 pb-10 lg:hidden overflow-y-auto"
          >
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="font-display border-b border-brass/10 py-4 text-[1.25rem] font-semibold text-ink flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <ArrowUpRight size={16} className="text-brass/60" />
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href={isSignedIn ? "/dashboard/events/new" : "/register"}
                onClick={() => setOpen(false)}
                className="btn btn-brass w-full font-bold justify-center"
              >
                Host an Event
              </Link>
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost w-full justify-center border-brass/25"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost w-full justify-center border-brass/25"
                >
                  Sign in
                </Link>
              )}
            </div>
            
            {/* Mobile Scripture Blessing */}
            <div className="mt-10 rounded-2xl border border-brass/20 bg-brass/5 p-4 text-center">
              <p className="font-display text-xs italic text-ink/80">
                &ldquo;For where two or three are gathered together in My name, there am I in the midst of them.&rdquo;
              </p>
              <span className="block mt-1 text-[0.65rem] font-bold uppercase tracking-wider text-brass">
                Matthew 18:20
              </span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
