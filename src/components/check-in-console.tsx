"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Loader2,
  ScanLine,
  Search,
  ShieldCheck,
  UserCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type AttendeeRow = {
  ticketCode: string;
  name: string;
  city: string;
  status: string;
};

type Result =
  | {
      kind: "success";
      name: string;
      ticketCode: string;
      ticketName: string;
      city: string;
      gate: string;
      staffName: string;
      accommodation: boolean;
      transport: boolean;
    }
  | {
      kind: "duplicate";
      name: string;
      ticketCode: string;
      ticketName: string;
      gate: string;
      staffName: string;
    }
  | { kind: "error"; message: string };

export function CheckInConsole({
  eventId,
  attendees,
  initialCheckedIn,
  initialRegistered,
}: {
  eventId: string;
  attendees: AttendeeRow[];
  initialCheckedIn: number;
  initialRegistered: number;
}) {
  const [code, setCode] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [checkedIn, setCheckedIn] = useState(initialCheckedIn);
  const [online, setOnline] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [result]);

  const runCheckIn = useCallback(
    async (ticketCode: string, method: "qr" | "manual") => {
      const trimmed = ticketCode.trim().toUpperCase();
      if (!trimmed) return;

      setBusy(true);
      setResult(null);
      try {
        const response = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            ticketCode: trimmed,
            method,
            staffName: "Adaeze Nwosu",
            gate: "Main entrance",
          }),
        });
        const data = await response.json();

        if (data.status === "checked_in") {
          setCheckedIn((n) => n + 1);
          setResult({
            kind: "success",
            name: `${data.attendee.firstName} ${data.attendee.lastName}`,
            ticketCode: data.attendee.ticketCode,
            ticketName: data.attendee.ticketName,
            city: data.attendee.city,
            gate: data.gate,
            staffName: data.staffName,
            accommodation: Boolean(data.attendee.accommodation),
            transport: Boolean(data.attendee.transport),
          });
          setCode("");
          return;
        }

        if (data.status === "already_checked_in") {
          setResult({
            kind: "duplicate",
            name: `${data.attendee.firstName} ${data.attendee.lastName}`,
            ticketCode: data.attendee.ticketCode,
            ticketName: data.attendee.ticketName,
            gate: data.gate,
            staffName: data.staffName,
          });
          setCode("");
          return;
        }

        setResult({
          kind: "error",
          message:
            typeof data.error === "string"
              ? data.error
              : "That ticket could not be validated.",
        });
      } catch {
        setResult({
          kind: "error",
          message:
            "The server could not be reached. This check-in has not been recorded — please try again once the connection returns.",
        });
      } finally {
        setBusy(false);
      }
    },
    [eventId]
  );

  const filtered = query
    ? attendees
        .filter((a) =>
          `${a.name} ${a.ticketCode} ${a.city}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
        .slice(0, 7)
    : attendees.slice(0, 7);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* Scanner */}
      <div className="relative overflow-hidden rounded-[16px] border border-[rgba(232,211,166,0.22)] bg-[rgba(247,243,236,0.055)] p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="eyebrow text-[0.585rem] text-brass-light">
              Check-in console
            </div>
            <h3 className="font-display mt-2.5 text-[1.35rem] leading-tight font-semibold text-parchment">
              Scan or enter a ticket code
            </h3>
          </div>
          <span
            className={
              online
                ? "pill border-[rgba(120,200,160,0.3)] bg-[rgba(47,107,79,0.22)] text-[#a6e0bd]"
                : "pill border-[rgba(230,170,90,0.35)] bg-[rgba(184,121,28,0.24)] text-[#f0c98e]"
            }
          >
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? "Connected · syncs immediately" : "Offline · will queue"}
          </span>
        </div>

        <form
          className="mt-7"
          onSubmit={(e) => {
            e.preventDefault();
            void runCheckIn(code, "qr");
          }}
        >
          <label htmlFor="ticket-code" className="eyebrow text-[0.565rem] text-[rgba(247,243,236,0.62)]">
            Ticket code
          </label>
          <div className="mt-2.5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <ScanLine
                size={18}
                className="absolute top-1/2 left-4 -translate-y-1/2 text-brass-light"
              />
              <input
                id="ticket-code"
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="TKT-XXXXXX-0000"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-[11px] border border-[rgba(232,211,166,0.28)] bg-[rgba(9,32,25,0.55)] py-3.5 pr-4 pl-11 text-[1.02rem] font-semibold tracking-[0.07em] text-parchment placeholder:font-normal placeholder:tracking-normal placeholder:text-[rgba(247,243,236,0.42)] focus:border-[var(--color-brass)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="btn btn-brass shrink-0"
            >
              {busy ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Validating…
                </>
              ) : (
                <>
                  <UserCheck size={17} /> Check in
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-[0.765rem] leading-[1.62] text-[rgba(247,243,236,0.58)]">
            Codes are validated on the server and recorded with a timestamp, the
            gate and the staff member. Duplicate check-ins are rejected.
          </p>
        </form>

        {/* Result */}
        {result ? (
          <div
            className={`mt-6 rounded-[13px] border p-6 ${
              result.kind === "success"
                ? "animate-pulse-brass border-[rgba(232,211,166,0.4)] bg-[rgba(232,211,166,0.14)]"
                : result.kind === "duplicate"
                  ? "border-[rgba(230,170,90,0.42)] bg-[rgba(184,121,28,0.16)]"
                  : "border-[rgba(220,130,110,0.42)] bg-[rgba(164,64,47,0.18)]"
            }`}
            role="status"
            aria-live="polite"
          >
            {result.kind === "error" ? (
              <div className="flex items-start gap-3.5">
                <AlertTriangle
                  size={21}
                  className="mt-0.5 shrink-0 text-[#f0b0a2]"
                />
                <div>
                  <h4 className="text-[1.015rem] font-semibold text-[#f7d9d1]">
                    Could not check in
                  </h4>
                  <p className="mt-1.5 text-[0.875rem] leading-[1.7] text-[rgba(247,217,209,0.86)]">
                    {result.message}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    result.kind === "success"
                      ? "bg-[rgba(232,211,166,0.3)]"
                      : "bg-[rgba(184,121,28,0.3)]"
                  }`}
                >
                  {result.kind === "success" ? (
                    <Check size={21} className="text-brass-light" />
                  ) : (
                    <AlertTriangle size={21} className="text-[#f0c98e]" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="font-display text-[1.32rem] leading-tight font-semibold text-parchment">
                    {result.name}
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="pill border-[rgba(247,243,236,0.22)] bg-[rgba(247,243,236,0.11)] text-[rgba(247,243,236,0.86)]">
                      {result.ticketName}
                    </span>
                    <span className="tnum pill border-[rgba(247,243,236,0.22)] bg-[rgba(247,243,236,0.11)] text-[rgba(247,243,236,0.86)]">
                      {result.ticketCode}
                    </span>
                    {result.kind === "success" && "city" in result ? (
                      <span className="pill border-[rgba(247,243,236,0.22)] bg-[rgba(247,243,236,0.11)] text-[rgba(247,243,236,0.86)]">
                        {result.city || "—"}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.795rem] text-[rgba(247,243,236,0.72)]">
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck size={13} className="text-brass-light" />
                      Gate: {result.gate}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={13} className="text-brass-light" />
                      Staff: {result.staffName}
                    </span>
                    {result.kind === "success" ? (
                      <>
                        {result.accommodation ? (
                          <span className="inline-flex items-center gap-2">
                            <Check size={13} className="text-brass-light" />
                            Accommodation on file
                          </span>
                        ) : null}
                        {result.transport ? (
                          <span className="inline-flex items-center gap-2">
                            <Check size={13} className="text-brass-light" />
                            Transport on file
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle size={13} className="text-[#f0c98e]" />
                        Already checked in at {result.gate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Manual search */}
      <div className="rounded-[16px] border border-[rgba(247,243,236,0.14)] bg-[rgba(247,243,236,0.045)] p-7">
        <div className="eyebrow text-[0.585rem] text-brass-light">
          Manual lookup
        </div>
        <h3 className="font-display mt-2.5 text-[1.35rem] leading-tight font-semibold text-parchment">
          Find an attendee
        </h3>

        <div className="relative mt-6">
          <Search
            size={17}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-[rgba(247,243,236,0.5)]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, city or ticket code"
            aria-label="Search attendees"
            className="w-full rounded-[11px] border border-[rgba(247,243,236,0.18)] bg-[rgba(9,32,25,0.42)] py-3 pr-4 pl-11 text-[0.9125rem] text-parchment placeholder:text-[rgba(247,243,236,0.42)] focus:border-[var(--color-brass)] focus:outline-none"
          />
        </div>

        <ul className="mt-5 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
          {filtered.map((attendee) => (
            <li
              key={attendee.ticketCode}
              className="flex items-center gap-3.5 rounded-[11px] border border-[rgba(247,243,236,0.1)] bg-[rgba(247,243,236,0.05)] px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[rgba(232,211,166,0.16)] text-[0.725rem] font-semibold text-brass-light">
                {attendee.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.865rem] font-semibold text-parchment">
                  {attendee.name}
                </div>
                <div className="tnum truncate text-[0.725rem] text-[rgba(247,243,236,0.58)]">
                  {attendee.ticketCode} · {attendee.city || "—"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void runCheckIn(attendee.ticketCode, "manual")}
                disabled={busy}
                className="btn btn-light shrink-0 !px-3.5 !py-2 !text-[0.765rem]"
              >
                Check in
              </button>
            </li>
          ))}

          {filtered.length === 0 ? (
            <li className="rounded-[11px] border border-dashed border-[rgba(247,243,236,0.18)] px-4 py-8 text-center">
              <Search
                size={20}
                className="mx-auto text-[rgba(247,243,236,0.42)]"
              />
              <p className="mt-3 text-[0.845rem] leading-[1.68] text-[rgba(247,243,236,0.62)]">
                No attendee matches “{query}”.
                <br />
                Check the spelling, or search by ticket code instead.
              </p>
            </li>
          ) : null}
        </ul>

        <div className="mt-6 rounded-[11px] border border-[rgba(247,243,236,0.12)] bg-[rgba(247,243,236,0.05)] p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.795rem] text-[rgba(247,243,236,0.68)]">
              Checked in this session
            </span>
            <span className="tnum font-display text-[1.42rem] leading-none font-semibold text-brass-light">
              {checkedIn.toLocaleString()}
            </span>
          </div>
          <div className="mt-3 h-[5px] w-full overflow-hidden rounded-full bg-[rgba(247,243,236,0.16)]">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${Math.min(100, (checkedIn / Math.max(1, initialRegistered)) * 100)}%`,
                background:
                  "linear-gradient(90deg, var(--color-brass), var(--color-brass-light))",
              }}
            />
          </div>
          <div className="mt-2 text-[0.715rem] text-[rgba(247,243,236,0.52)]">
            {Math.round((checkedIn / Math.max(1, initialRegistered)) * 100)}% of{" "}
            {initialRegistered.toLocaleString()} registered attendees
          </div>
        </div>
      </div>
    </div>
  );
}
