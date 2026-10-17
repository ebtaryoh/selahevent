"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem("selah-theme") as Theme | null;
      if (storedTheme === "light" || storedTheme === "dark") {
        setThemeState(storedTheme);
        applyTheme(storedTheme);
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initialTheme: Theme = prefersDark ? "dark" : "dark"; // Default to dark aesthetic for Selah
        setThemeState(initialTheme);
        applyTheme(initialTheme);
      }
    } catch {
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t);
    if (t === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      localStorage.setItem("selah-theme", newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as Theme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}

export function ThemeToggle({
  className = "",
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center gap-2 rounded-full border border-brass/25 bg-brass/10 px-3 py-2 text-xs font-semibold text-brass transition-all duration-300 hover:border-brass/50 hover:bg-brass/20 hover:scale-105 active:scale-95 cursor-pointer shadow-sm ${className}`}
      aria-label={`Switch to ${isDark ? "Light Sanctuary" : "Dark Sanctuary"} mode`}
      title={`Switch to ${isDark ? "Light Sanctuary (Cathedral Ivory)" : "Dark Sanctuary (Midnight Cypress)"}`}
    >
      <div className="relative h-4 w-4 shrink-0 overflow-hidden">
        {isDark ? (
          <Sun
            size={16}
            className="text-brass transition-transform duration-300 group-hover:rotate-45"
          />
        ) : (
          <Moon
            size={16}
            className="text-brass-deep transition-transform duration-300 group-hover:-rotate-12"
          />
        )}
      </div>
      {showLabel ? (
        <span className="font-medium tracking-wide">
          {isDark ? "Cathedral Light" : "Midnight Dark"}
        </span>
      ) : null}
    </button>
  );
}
