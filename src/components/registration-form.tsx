"use client";
import Image from "next/image";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn, formatMoney, formatRange, formatTime } from "@/lib/format";
import { requestAttendeeOTP, verifyAttendeeOTP, getAttendeeProfile } from "@/lib/attendee";

export type TicketOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  badge: string | null;
  benefits: string[] | null;
  capacity: number;
  remaining: number;
};

export type EventSummary = {
  title: string;
  slug: string;
  orgId: string;
  city: string;
  venueName: string | null;
  venueAddress: string | null;
  startsAt: string;
  endsAt: string;
  coverImage: string | null;
  customQuestions?: {
    id: string;
    label: string;
    type: "text" | "select";
    options?: string[];
    required: boolean;
  }[] | null;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  ticketTypeId: string;
  attendeeType: string;
  church: string;
  accommodation: boolean;
  transport: boolean;
  dietary: string;
  emergencyName: string;
  emergencyPhone: string;
  consent: boolean;
};

const initial = (firstTicketId: string): FormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "NG",
  ticketTypeId: firstTicketId,
  attendeeType: "delegate",
  church: "",
  accommodation: false,
  transport: false,
  dietary: "",
  emergencyName: "",
  emergencyPhone: "",
  consent: false,
});

const STEPS = [
  { n: 1, label: "About you" },
  { n: 2, label: "Participation" },
  { n: 3, label: "Details" },
  { n: 4, label: "Review" },
];

export function RegistrationForm({
  event,
  tickets,
}: {
  event: EventSummary;
  tickets: TicketOption[];
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState<null | {
    code: string;
    ticketCode: string;
    name: string;
    ticketName: string;
    amount: number;
    currency: string;
    paymentRequired: boolean;
    paymentMessage: string | null;
  }>(null);

  const [form, setForm] = useState<FormState>(() =>
    initial(tickets[0]?.id ?? "")
  );
  
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  
  // OTP Flow States
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === form.ticketTypeId) ?? tickets[0],
    [tickets, form.ticketTypeId]
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (form.firstName.trim().length < 2)
        errors.firstName = "Please enter your first name.";
      if (form.lastName.trim().length < 2)
        errors.lastName = "Please enter your last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
        errors.email = "Please enter a valid email address.";
      if (form.phone.trim().length < 7)
        errors.phone = "Please enter a phone number we can reach you on.";
    }

    if (step === 3) {
      if (form.emergencyName.trim().length < 2)
        errors.emergencyName = "An emergency contact is required for this event.";
      if (form.emergencyPhone.trim().length < 7)
        errors.emergencyPhone = "Please enter a valid phone number.";
      if (!form.consent)
        errors.consent = "Please accept the privacy notice to continue.";

      event.customQuestions?.forEach((q) => {
        if (q.required && !customAnswers[q.id]?.trim()) {
          errors[`customQuestion_${q.id}`] = "This field is required.";
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setError(null);
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          ticketTypeId: form.ticketTypeId || null,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          country: form.country,
          church: form.church,
          attendeeType: form.attendeeType,
          accommodation: form.accommodation,
          transport: form.transport,
          dietary: form.dietary,
          emergencyName: form.emergencyName,
          emergencyPhone: form.emergencyPhone,
          customAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Something went wrong while saving your registration."
        );
        return;
      }

      setConfirmation({
        code: data.registration.code,
        ticketCode: data.registration.ticketCode,
        name: `${data.registration.firstName} ${data.registration.lastName}`,
        ticketName: selectedTicket?.name ?? "General admission",
        amount: data.registration.amount,
        currency: data.registration.currency,
        paymentRequired: data.payment.required,
        paymentMessage: data.payment.message,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(
        "We couldn't reach the server. Please check your connection and try again — nothing has been submitted twice."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- Confirmation ---------------- */

  const handleRequestOTP = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setFieldErrors({ email: "Please enter a valid email address." });
      return;
    }
    setOtpLoading(true);
    const res = await requestAttendeeOTP(form.email, event.orgId);
    setOtpLoading(false);
    if (res.error) {
      setFieldErrors({ email: res.error });
    } else {
      setOtpMode(true);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) return;
    setOtpLoading(true);
    setOtpError(null);
    const res = await verifyAttendeeOTP(form.email, event.orgId, otpCode);
    if (res.error) {
      setOtpError(res.error);
      setOtpLoading(false);
    } else {
      setEmailVerified(true);
      setOtpMode(false);
      setOtpLoading(false);
      
      const profile = await getAttendeeProfile();
      if (profile) {
        setForm(prev => ({
          ...prev,
          firstName: profile.firstName || prev.firstName,
          lastName: profile.lastName || prev.lastName,
          phone: profile.phone || prev.phone,
        }));
      }
    }
  };

  if (confirmation) {
    return (
      <ConfirmationPanel
        event={event}
        confirmation={confirmation}
        email={form.email}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
      <div className="card overflow-hidden">
        {/* Stepper */}
        <div className="border-b border-[rgba(22,19,17,0.1)] px-6 pt-7 pb-6 sm:px-9">
          <div className="flex items-center justify-between gap-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => s.n < step && setStep(s.n)}
                  disabled={s.n > step}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[0.8rem] font-semibold transition-colors",
                    s.n === step
                      ? "border-transparent bg-cypress text-brass-light"
                      : s.n < step
                        ? "border-[rgba(192,138,46,0.45)] bg-[rgba(192,138,46,0.12)] text-[var(--color-brass-deep)]"
                        : "border-[rgba(22,19,17,0.14)] bg-transparent text-warm-400"
                  )}
                  aria-current={s.n === step ? "step" : undefined}
                >
                  {s.n < step ? <Check size={15} strokeWidth={2.6} /> : s.n}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate text-[0.795rem] font-semibold",
                      s.n === step ? "text-ink" : "text-warm-400"
                    )}
                  >
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 ? (
                    <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[rgba(22,19,17,0.09)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-brass)] transition-[width] duration-500"
                        style={{ width: s.n < step ? "100%" : "0%" }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-8 sm:px-9">
          {step === 1 ? (
            <div>
              <StepHeading
                title="Let's start with the basics"
                subtitle="This is what appears on your ticket and badge."
              />
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {!emailVerified ? (
                  <div className="col-span-1 sm:col-span-2 max-w-md">
                    {!otpMode ? (
                      <div className="space-y-4">
                        <Field
                          label="Email address"
                          required
                          error={fieldErrors.email}
                          hint="Enter your email to continue."
                        >
                          <input
                            className="input"
                            type="email"
                            value={form.email}
                            autoComplete="email"
                            onChange={(e) => update("email", e.target.value)}
                            aria-invalid={Boolean(fieldErrors.email)}
                            placeholder="you@example.com"
                          />
                        </Field>
                        <button
                          type="button"
                          className="btn btn-primary w-full justify-center"
                          onClick={handleRequestOTP}
                          disabled={otpLoading}
                        >
                          {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Field
                          label="Verification Code"
                          required
                          error={otpError || ""}
                          hint={`We sent a 6-digit code to ${form.email}`}
                        >
                          <input
                            className="input text-center tracking-[0.5em] font-mono text-lg"
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                          />
                        </Field>
                        <button
                          type="button"
                          className="btn btn-primary w-full justify-center"
                          onClick={handleVerifyOTP}
                          disabled={otpLoading || otpCode.length < 6}
                        >
                          {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Code"}
                        </button>
                        <div className="text-center pt-2">
                          <button
                            type="button"
                            className="text-[0.8rem] font-medium text-[var(--color-brass)] hover:underline"
                            onClick={() => setOtpMode(false)}
                          >
                            Use a different email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Field
                      label="Email address"
                      required
                      hint="Verified"
                    >
                      <input
                        className="input bg-[rgba(22,19,17,0.03)] text-warm-400 border-transparent shadow-none"
                        type="email"
                        value={form.email}
                        readOnly
                        disabled
                      />
                    </Field>
                    <div className="hidden sm:block"></div>
                    <Field
                      label="First name"
                      required
                      error={fieldErrors.firstName}
                    >
                      <input
                        className="input"
                        value={form.firstName}
                        autoComplete="given-name"
                        onChange={(e) => update("firstName", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.firstName)}
                        placeholder="Amara"
                      />
                    </Field>
                    <Field label="Last name" required error={fieldErrors.lastName}>
                      <input
                        className="input"
                        value={form.lastName}
                        autoComplete="family-name"
                        onChange={(e) => update("lastName", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.lastName)}
                        placeholder="Eze"
                      />
                    </Field>
                    <Field label="Phone number" required error={fieldErrors.phone}>
                      <input
                        className="input"
                        type="tel"
                        value={form.phone}
                        autoComplete="tel"
                        onChange={(e) => update("phone", e.target.value)}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        placeholder="+234 800 000 0000"
                      />
                    </Field>
                    <Field label="City">
                      <input
                        className="input"
                        value={form.city}
                        autoComplete="address-level2"
                        onChange={(e) => update("city", e.target.value)}
                        placeholder="Lagos"
                      />
                    </Field>
                    <Field label="Country">
                      <select
                        className="input"
                        value={form.country}
                        onChange={(e) => update("country", e.target.value)}
                      >
                        {[
                          ["NG", "Nigeria"],
                          ["GH", "Ghana"],
                          ["KE", "Kenya"],
                          ["ZA", "South Africa"],
                          ["GB", "United Kingdom"],
                          ["US", "United States"],
                          ["CA", "Canada"],
                          ["AU", "Australia"],
                        ].map(([code, name]) => (
                          <option key={code} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <StepHeading
                title="How will you be participating?"
                subtitle="Choose the ticket that fits — you can change it before you confirm."
              />

              <fieldset className="mt-7">
                <legend className="field-label">Ticket type</legend>
                <div className="space-y-3">
                  {tickets.map((ticket) => {
                    const active = ticket.id === form.ticketTypeId;
                    return (
                      <label
                        key={ticket.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-[13px] border p-5 transition-colors",
                          active
                            ? "border-[var(--color-brass-deep)] bg-[rgba(192,138,46,0.09)]"
                            : "border-[rgba(22,19,17,0.13)] bg-paper hover:border-[rgba(192,138,46,0.5)]"
                        )}
                      >
                        <input
                          type="radio"
                          name="ticketType"
                          className="sr-only"
                          checked={active}
                          onChange={() => update("ticketTypeId", ticket.id)}
                        />
                        <span
                          className={cn(
                            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                            active
                              ? "border-[var(--color-brass-deep)]"
                              : "border-[rgba(22,19,17,0.24)]"
                          )}
                          aria-hidden="true"
                        >
                          {active ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brass-deep)]" />
                          ) : null}
                        </span>
                        <span className="flex-1">
                          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <span className="text-[0.975rem] font-semibold text-ink">
                              {ticket.name}
                            </span>
                            {ticket.badge ? (
                              <span className="pill pill-brass !text-[0.665rem]">
                                {ticket.badge}
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-1.5 block text-[0.845rem] leading-[1.68] text-warm-500">
                            {ticket.description}
                          </span>
                          <span className="tnum mt-2 block text-[0.8rem] text-warm-400">
                            {ticket.capacity === 0
                              ? "Unlimited places available"
                              : ticket.remaining > 0
                              ? `${ticket.remaining.toLocaleString()} places remaining`
                              : "At capacity"}
                          </span>
                        </span>
                        <span className="tnum shrink-0 text-[1.02rem] font-semibold text-ink">
                          {ticket.price === 0
                            ? "Free"
                            : formatMoney(ticket.price, ticket.currency)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="I am attending as">
                  <select
                    className="input"
                    value={form.attendeeType}
                    onChange={(e) => update("attendeeType", e.target.value)}
                  >
                    <option value="delegate">Delegate</option>
                    <option value="student">Student</option>
                    <option value="minister">Minister / clergy</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="speaker">Speaker</option>
                    <option value="guest">Guest</option>
                  </select>
                </Field>
                <Field label="Church or organisation">
                  <input
                    className="input"
                    value={form.church}
                    onChange={(e) => update("church", e.target.value)}
                    placeholder="Grace Fellowship"
                  />
                </Field>
              </div>

              <div className="mt-7 space-y-3">
                <Toggle
                  checked={form.accommodation}
                  onChange={(v) => update("accommodation", v)}
                  title="I need accommodation"
                  body="Arrival, departure and room preference are arranged by the event team after registration."
                />
                <Toggle
                  checked={form.transport}
                  onChange={(v) => update("transport", v)}
                  title="I need transport to the venue"
                  body="Pickup points and departure times are shared closer to the event date."
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <StepHeading
                title="A few final details"
                subtitle="Only what the event team needs to look after you well."
              />

              <div className="mt-7">
                <Field
                  label="Dietary requirements or allergies"
                  hint="Optional. Shared only with the catering and welfare teams."
                >
                  <input
                    className="input"
                    value={form.dietary}
                    onChange={(e) => update("dietary", e.target.value)}
                    placeholder="e.g. vegetarian, no nuts"
                  />
                </Field>
              </div>

              {event.customQuestions && event.customQuestions.length > 0 && (
                <div className="mt-8 border-t border-[rgba(22,19,17,0.1)] pt-8">
                  <h3 className="mb-5 text-[1.05rem] font-semibold text-ink">
                    Additional Information
                  </h3>
                  <div className="grid gap-5">
                    {event.customQuestions.map((q) => (
                      <Field
                        key={q.id}
                        label={q.label}
                        required={q.required}
                        error={fieldErrors[`customQuestion_${q.id}`]}
                      >
                        {q.type === "select" ? (
                          <select
                            className="input appearance-none bg-white"
                            value={customAnswers[q.id] || ""}
                            onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            aria-invalid={Boolean(fieldErrors[`customQuestion_${q.id}`])}
                          >
                            <option value="">Select an option...</option>
                            {q.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="input"
                            value={customAnswers[q.id] || ""}
                            onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            aria-invalid={Boolean(fieldErrors[`customQuestion_${q.id}`])}
                          />
                        )}
                      </Field>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-[13px] border border-[rgba(192,138,46,0.28)] bg-[rgba(192,138,46,0.07)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-[var(--color-brass-deep)]"
                  />
                  <div>
                    <h3 className="text-[0.905rem] font-semibold text-ink">
                      Emergency contact
                    </h3>
                    <p className="mt-1.5 text-[0.8125rem] leading-[1.68] text-warm-600">
                      Required for on-site events. This information is visible
                      only to authorised welfare staff and is never published.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Contact name"
                    required
                    error={fieldErrors.emergencyName}
                  >
                    <input
                      className="input"
                      value={form.emergencyName}
                      onChange={(e) => update("emergencyName", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.emergencyName)}
                      placeholder="Full name"
                    />
                  </Field>
                  <Field
                    label="Contact phone"
                    required
                    error={fieldErrors.emergencyPhone}
                  >
                    <input
                      className="input"
                      type="tel"
                      value={form.emergencyPhone}
                      onChange={(e) => update("emergencyPhone", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.emergencyPhone)}
                      placeholder="+234 800 000 0000"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-7">
                <label className="flex cursor-pointer items-start gap-3.5">
                  <input
                    type="checkbox"
                    className="mt-1 h-[19px] w-[19px] shrink-0 accent-[var(--color-brass-deep)]"
                    checked={form.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                    aria-invalid={Boolean(fieldErrors.consent)}
                  />
                  <span className="text-[0.865rem] leading-[1.72] text-warm-600">
                    I agree that{" "}
                    <strong className="font-semibold text-ink">
                      the organising team
                    </strong>{" "}
                    may use the information I&apos;ve provided to administer my
                    registration, arrange hospitality and contact me about this
                    event. I can request its deletion at any time.
                  </span>
                </label>
                {fieldErrors.consent ? (
                  <p className="mt-2.5 flex items-center gap-2 text-[0.8rem] font-medium text-[var(--color-signal-red)]">
                    <Info size={14} /> {fieldErrors.consent}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <StepHeading
                title="Review and confirm"
                subtitle="Check the details below — you can go back to change anything."
              />

              <dl className="mt-7 overflow-hidden rounded-[13px] border border-[rgba(22,19,17,0.11)]">
                {[
                  ["Name", `${form.firstName} ${form.lastName}`],
                  ["Email", form.email],
                  ["Phone", form.phone],
                  [
                    "Location",
                    [form.city, form.country].filter(Boolean).join(", ") ||
                      "—",
                  ],
                  ["Attending as", form.attendeeType],
                  ["Church / organisation", form.church || "—"],
                  ["Ticket", selectedTicket?.name ?? "—"],
                  [
                    "Hospitality",
                    [
                      form.accommodation ? "Accommodation requested" : null,
                      form.transport ? "Transport requested" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Not required",
                  ],
                  ["Dietary", form.dietary || "None specified"],
                  [
                    "Emergency contact",
                    form.emergencyName
                      ? `${form.emergencyName} · ${form.emergencyPhone}`
                      : "—",
                  ],
                ].map(([term, value], i) => (
                  <div
                    key={term}
                    className={cn(
                      "flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                      i % 2 === 0
                        ? "bg-[rgba(22,19,17,0.028)]"
                        : "bg-paper"
                    )}
                  >
                    <dt className="text-[0.785rem] font-medium tracking-[0.045em] text-warm-400 uppercase">
                      {term}
                    </dt>
                    <dd className="text-[0.9125rem] font-medium text-ink">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[13px] border border-[rgba(22,19,17,0.11)] bg-[rgba(192,138,46,0.08)] p-5">
                <div>
                  <div className="eyebrow text-[0.565rem] text-warm-500">
                    Total due
                  </div>
                  <div className="tnum font-display mt-1.5 text-[1.85rem] leading-none font-semibold text-ink">
                    {selectedTicket?.price === 0
                      ? "Free"
                      : formatMoney(
                          selectedTicket?.price ?? 0,
                          selectedTicket?.currency ?? "NGN"
                        )}
                  </div>
                </div>
                <p className="max-w-[20rem] text-[0.795rem] leading-[1.68] text-warm-600">
                  {selectedTicket?.price === 0
                    ? "No payment is required. You'll receive your ticket immediately after confirming."
                    : "You'll be shown the secure payment step after confirming. Card details are never handled by Selah."}
                </p>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-[12px] border border-[rgba(164,64,47,0.28)] bg-[rgba(164,64,47,0.08)] p-4"
                >
                  <Info
                    size={18}
                    className="mt-0.5 shrink-0 text-[var(--color-signal-red)]"
                  />
                  <p className="text-[0.865rem] leading-[1.68] text-[var(--color-signal-red)]">
                    {error}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-[rgba(22,19,17,0.1)] bg-[rgba(22,19,17,0.022)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9">
          {step > 1 ? (
            <button type="button" onClick={back} className="btn btn-ghost">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <Link
              href={`/e/${event.slug}`}
              className="btn btn-ghost"
            >
              <ArrowLeft size={16} /> Back to event
            </Link>
          )}

          {step < 4 ? (
            <button 
              type="button" 
              onClick={next} 
              className={cn("btn btn-primary", step === 1 && !emailVerified && "hidden")}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn btn-brass"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  Confirm registration <Check size={17} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Summary rail */}
      <aside className="space-y-6">
        <div className="overflow-hidden rounded-[16px] border border-[rgba(22,19,17,0.11)] bg-cypress text-parchment">
          <div className="relative h-[168px] w-full overflow-hidden bg-cypress/10 flex items-center justify-center">
            {event.coverImage ? (
              <Image
                src={event.coverImage}
                alt=""
                aria-hidden="true"
                className="object-cover"
                fill
              />
            ) : (
              <CalendarDays size={40} className="text-parchment/40" />
            )}
            <div
              className="-mt-[168px] h-[168px] w-full"
              style={{
                background:
                  "linear-gradient(180deg, rgba(9,32,25,0.1) 0%, rgba(9,32,25,0.85) 100%)",
              }}
            />
          </div>
          <div className="p-6">
            <h2 className="font-display text-[1.22rem] leading-tight font-semibold">
              {event.title}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5 text-[0.845rem] text-[rgba(247,243,236,0.78)]">
                <Ticket size={15} className="mt-0.5 shrink-0 text-brass-light" />
                {formatRange(event.startsAt, event.endsAt)} ·{" "}
                {formatTime(event.startsAt)}
              </div>
              <div className="flex items-start gap-2.5 text-[0.845rem] text-[rgba(247,243,236,0.78)]">
                <MapPin
                  size={15}
                  className="mt-0.5 shrink-0 text-brass-light"
                />
                {event.venueName}
                {event.venueAddress ? `, ${event.venueAddress}` : ""} ·{" "}
                {event.city}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-[0.925rem] font-semibold text-ink">
            Your selection
          </h3>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-[0.865rem] text-warm-500">
                {selectedTicket?.name}
              </div>
              <div className="tnum mt-1 text-[1.42rem] leading-none font-semibold text-ink">
                {selectedTicket?.price === 0
                  ? "Free"
                  : formatMoney(
                      selectedTicket?.price ?? 0,
                      selectedTicket?.currency ?? "NGN"
                    )}
              </div>
            </div>
            <Link
              href={`/e/${event.slug}#tickets`}
              className="text-[0.795rem] font-semibold text-[var(--color-brass-deep)] underline underline-offset-4"
            >
              Change
            </Link>
          </div>

          {selectedTicket?.benefits?.length ? (
            <ul className="mt-5 space-y-2 border-t border-[rgba(22,19,17,0.09)] pt-5">
              {selectedTicket.benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-[0.8125rem] leading-relaxed text-warm-600"
                >
                  <Check
                    size={14}
                    className="mt-1 shrink-0 text-[var(--color-brass-deep)]"
                  />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex items-start gap-3 rounded-[13px] border border-[rgba(22,19,17,0.11)] bg-paper p-5">
          <ShieldCheck
            size={18}
            className="mt-0.5 shrink-0 text-[var(--color-brass-deep)]"
          />
          <p className="text-[0.8125rem] leading-[1.72] text-warm-600">
            Your details are used only to administer this event. Payment, if
            required, is handled by the payment provider — Selah never sees your
            card number.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function StepHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-display text-[clamp(1.55rem,3vw,2.05rem)] leading-[1.15] font-semibold text-ink">
        {title}
      </h2>
      <p className="mt-2.5 text-[0.945rem] leading-[1.7] text-warm-500">
        {subtitle}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  hint,
  error,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--color-signal-red)]">*</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p className="mt-2 flex items-center gap-1.5 text-[0.785rem] font-medium text-[var(--color-signal-red)]">
          <Info size={13} /> {error}
        </p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  body,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-[13px] border p-5 transition-colors",
        checked
          ? "border-[var(--color-brass-deep)] bg-[rgba(192,138,46,0.08)]"
          : "border-[rgba(22,19,17,0.13)] bg-paper"
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-[3px] transition-colors",
          checked ? "bg-[var(--color-brass-deep)]" : "bg-[rgba(22,19,17,0.18)]"
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-[20px]" : "translate-x-0"
          )}
        />
      </span>
      <span>
        <span className="block text-[0.905rem] font-semibold text-ink">
          {title}
        </span>
        <span className="mt-1 block text-[0.825rem] leading-[1.68] text-warm-500">
          {body}
        </span>
      </span>
    </label>
  );
}

function buildIcs(event: EventSummary) {
  const stamp = (iso: string) =>
    new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Selah Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.slug}@selah.events`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(event.startsAt)}`,
    `DTEND:${stamp(event.endsAt)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${[event.venueName, event.venueAddress, event.city]
      .filter(Boolean)
      .join(", ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function ConfirmationPanel({
  event,
  confirmation,
  email,
}: {
  event: EventSummary;
  confirmation: {
    code: string;
    ticketCode: string;
    name: string;
    ticketName: string;
    amount: number;
    currency: string;
    paymentRequired: boolean;
    paymentMessage: string | null;
  };
  email: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mx-auto max-w-[52rem]">
      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-cypress px-7 py-12 text-center text-parchment sm:px-12">
          <div className="grain pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(232,211,166,0.4)] bg-[rgba(232,211,166,0.16)]">
              <CheckCircle2 size={30} className="text-brass-light" />
            </span>
            <h2 className="font-display mt-6 text-[clamp(2rem,4.5vw,2.85rem)] leading-[1.08] font-semibold">
              You&apos;re registered.
            </h2>
            <p className="mx-auto mt-4 max-w-[30rem] text-[1.025rem] leading-[1.72] text-[rgba(247,243,236,0.82)]">
              A confirmation has been prepared for{" "}
              <strong className="font-semibold text-brass-light">{email}</strong>
              . Your ticket code is{" "}
              <strong className="tnum font-semibold text-brass-light">
                {confirmation.code}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_auto]">
          <div className="px-7 py-9 sm:px-10">
            <div className="eyebrow text-[0.585rem] text-warm-400">
              Digital ticket
            </div>
            <h3 className="font-display mt-3 text-[1.52rem] leading-tight font-semibold text-ink">
              {event.title}
            </h3>

            <dl className="mt-7 space-y-0">
              {[
                ["Attendee", confirmation.name],
                ["Ticket", confirmation.ticketName],
                [
                  "Dates",
                  formatRange(event.startsAt, event.endsAt),
                ],
                [
                  "Venue",
                  `${event.venueName ?? ""}${
                    event.venueAddress ? `, ${event.venueAddress}` : ""
                  } · ${event.city}`.trim(),
                ],
                [
                  "Amount",
                  confirmation.amount === 0
                    ? "Free registration"
                    : formatMoney(confirmation.amount, confirmation.currency),
                ],
              ].map(([term, value]) => (
                <div
                  key={term}
                  className="flex flex-col gap-1 border-t border-[rgba(22,19,17,0.1)] py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <dt className="text-[0.755rem] font-semibold tracking-[0.11em] text-warm-400 uppercase">
                    {term}
                  </dt>
                  <dd className="text-[0.945rem] font-medium text-ink">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {confirmation.paymentMessage ? (
              <div className="mt-7 flex items-start gap-3 rounded-[12px] border border-[rgba(184,121,28,0.3)] bg-[rgba(184,121,28,0.09)] p-4">
                <Info
                  size={18}
                  className="mt-0.5 shrink-0 text-[var(--color-signal-amber)]"
                />
                <p className="text-[0.845rem] leading-[1.7] text-[#7d5212]">
                  {confirmation.paymentMessage}
                </p>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(
                  buildIcs(event)
                )}`}
                download={`${event.slug}.ics`}
                className="btn btn-primary"
              >
                <CalendarPlus size={16} /> Add to calendar
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard
                    ?.writeText(
                      `${typeof window !== "undefined" ? window.location.origin : ""}/e/${event.slug}`
                    )
                    .then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 2200);
                    })
                    .catch(() => setCopied(false));
                }}
                className="btn btn-ghost"
              >
                {copied ? (
                  <>
                    <Check size={16} /> Link copied
                  </>
                ) : (
                  <>
                    <Copy size={16} /> Share event
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-ghost"
              >
                <Download size={16} /> Download confirmation
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 border-t border-[rgba(22,19,17,0.1)] bg-[rgba(192,138,46,0.07)] px-8 py-10 md:border-t-0 md:border-l">
            <div className="rounded-[14px] border border-[rgba(22,19,17,0.12)] bg-white p-4">
              <QRCodeSVG
                value={`SELAH:${confirmation.ticketCode}`}
                size={168}
                level="M"
                bgColor="#ffffff"
                fgColor="#0e2a22"
              />
            </div>
            <div className="text-center">
              <div className="eyebrow text-[0.545rem] text-warm-400">
                Ticket code
              </div>
              <div className="tnum mt-1.5 text-[0.955rem] font-semibold tracking-[0.06em] text-ink">
                {confirmation.ticketCode}
              </div>
              <p className="mt-2.5 max-w-[12rem] text-[0.735rem] leading-[1.6] text-warm-500">
                Show this at the entrance. It contains no personal information.
              </p>
            </div>
            <Link
              href={`/e/${event.slug}`}
              className="btn btn-ghost w-full !py-2.5 !text-[0.825rem]"
            >
              Back to event
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
