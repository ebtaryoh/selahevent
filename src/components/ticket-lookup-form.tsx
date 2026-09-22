"use client";

import { useState } from "react";

export function TicketLookupForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    try {
      const res = await fetch("/api/my-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to lookup tickets");
      }

      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-[12px] bg-green-50 p-6 text-center text-green-900 border border-green-100">
        <h3 className="font-semibold mb-2">Check your inbox</h3>
        <p className="text-sm">
          If there are any tickets associated with <strong>{email}</strong>, we've just sent you an email with magic links to access them.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-[0.8125rem] font-medium text-[#161311]">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g., hello@example.com"
          required
          className="w-full rounded-[10px] border border-[rgba(22,19,17,0.1)] bg-[#fdf8f4] px-4 py-3 text-[0.95rem] text-[#161311] placeholder-[#867c74] transition-all hover:bg-white focus:border-[#161311] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#161311]"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex h-12 items-center justify-center rounded-[12px] bg-[#c08a2e] text-[0.95rem] font-medium text-white transition-all hover:bg-[#a67525] hover:shadow-md disabled:opacity-50"
      >
        {status === "loading" ? "Finding tickets..." : "Find my tickets"}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-600 text-center mt-2">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
