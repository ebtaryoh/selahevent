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
  MessageSquare,
  ShieldCheck,
  Ticket,
  UserPlus,
  Users,
  Trash2,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn, formatMoney, formatRange, formatTime } from "@/lib/format";
import { requestAttendeeOTP, verifyAttendeeOTP, getAttendeeProfile } from "@/lib/attendee";
import { generateWhatsAppTicketLink } from "@/lib/whatsapp";
import { SaveTicketImageButton } from "@/components/save-ticket-image-button";

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
  isDonation?: boolean;
  passFeeToAttendee?: boolean;
};

export type GuestFormItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ticketTypeId: string;
  relationship: string;
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
  attendeeTypes?: string[] | null;
  accommodationMode?: "none" | "free" | "paid" | "both";
  collectGender?: boolean;
  collectAgeBracket?: boolean;
  collectOccupation?: boolean;
};

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  gender: string;
  ageBracket: string;
  occupation: string;
  ticketTypeId: string;
  attendeeType: string;
  church: string;
  accommodation: boolean;
  accommodationPreference: "none" | "free" | "paid";
  transport: boolean;
  dietary: string;
  emergencyName: string;
  emergencyPhone: string;
  consent: boolean;
  donationAmount: string;
  followMinistry?: boolean;
};

const initial = (firstTicketId: string): FormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  city: "",
  country: "NG",
  gender: "",
  ageBracket: "",
  occupation: "",
  ticketTypeId: firstTicketId,
  attendeeType: "delegate",
  church: "",
  accommodation: false,
  accommodationPreference: "none",
  transport: false,
  dietary: "",
  emergencyName: "",
  emergencyPhone: "",
  consent: false,
  donationAmount: "",
  followMinistry: true,
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
  initialTicketId,
  isStaff,
}: {
  event: EventSummary;
  tickets: TicketOption[];
  initialTicketId?: string;
  isStaff?: boolean;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const [confirmation, setConfirmation] = useState<null | {
    code: string;
    ticketCode: string;
    name: string;
    ticketName: string;
    amount: number;
    currency: string;
    paymentRequired: boolean;
    paymentMessage: string | null;
    status?: string;
    allTickets?: Array<{
      code: string;
      ticketCode: string;
      name: string;
      ticketName: string;
      email?: string;
      relationship?: string | null;
    }>;
  }>(null);

  const [isExpressMode, setIsExpressMode] = useState<boolean>(false);
  const [guests, setGuests] = useState<GuestFormItem[]>([]);

  const addGuest = () => {
    if (guests.length >= 6) return;
    setGuests((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        ticketTypeId: form.ticketTypeId || tickets[0]?.id || "",
        relationship: "Family Member",
      },
    ]);
  };

  const updateGuest = (id: string, field: keyof GuestFormItem, value: string) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const [form, setForm] = useState<FormState>(() =>
    initial(initialTicketId || tickets[0]?.id || "")
  );

  useEffect(() => {
    if (initialTicketId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, ticketTypeId: initialTicketId }));
    }
  }, [initialTicketId]);
  
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

  // Pricing calculations including group guests and pass-through convenience fee
  const totalBasePrice = useMemo(() => {
    const primaryPrice = selectedTicket?.isDonation && parseFloat(form.donationAmount) >= selectedTicket.price
      ? parseFloat(form.donationAmount)
      : (selectedTicket?.price ?? 0);
    const guestsPrice = guests.reduce((sum, g) => {
      const t = tickets.find((tk) => tk.id === g.ticketTypeId) || selectedTicket;
      return sum + (t?.price ?? 0);
    }, 0);
    return primaryPrice + guestsPrice;
  }, [selectedTicket, form.donationAmount, guests, tickets]);

  const passFee = Boolean(selectedTicket?.passFeeToAttendee ?? true);
  const convenienceFee = useMemo(() => {
    if (!passFee || totalBasePrice <= 0) return 0;
    return Math.min(2000, Math.round(totalBasePrice < 2500 ? totalBasePrice * 0.015 : (totalBasePrice * 0.015 + 100)));
  }, [passFee, totalBasePrice]);

  const grandTotal = totalBasePrice + convenienceFee;

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validateStep = (isSubmit = false) => {
    const errors: Record<string, string> = {};

    if (isExpressMode) {
      if (form.firstName.trim().length < 2)
        errors.firstName = "Please enter your first name.";
      if (form.lastName.trim().length < 2)
        errors.lastName = "Please enter your last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
        errors.email = "Please enter a valid email address.";
      if (form.phone.trim().length < 7)
        errors.phone = "Please enter your WhatsApp or mobile number.";
      if (event.collectGender && !form.gender)
        errors.gender = "Please select your gender.";
      if (!form.consent)
        errors.consent = "Please agree to the privacy notice to proceed.";

      guests.forEach((g, idx) => {
        if (!g.firstName.trim()) {
          errors[`guest_${g.id}_name`] = `Please enter first name for guest #${idx + 1}.`;
        }
      });

      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }

    // Always validate step 1 fields if we are trying to proceed from step 1, 
    // or if we are on step 3, or if we are submitting.
    if (step === 1 || step === 3 || isSubmit) {
      if (form.firstName.trim().length < 2)
        errors.firstName = "Please enter your first name.";
      if (form.lastName.trim().length < 2)
        errors.lastName = "Please enter your last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
        errors.email = "Please enter a valid email address.";
      if (form.phone.trim().length < 7)
        errors.phone = "Please enter a phone number we can reach you on.";
      if (event.collectGender && !form.gender)
        errors.gender = "Please select your gender.";

      guests.forEach((g, idx) => {
        if (!g.firstName.trim()) {
          errors[`guest_${g.id}_name`] = `Please enter first name for guest #${idx + 1}.`;
        }
      });
    }

    if (step === 2 || step === 3 || isSubmit) {
      if (event.collectAgeBracket && !form.ageBracket)
        errors.ageBracket = "Please select your age bracket.";
      if (event.collectOccupation && !form.occupation)
        errors.occupation = "Please select your occupation / employment status.";
      if ((event.accommodationMode === "free" || event.accommodationMode === "both") && form.accommodation && form.accommodationPreference === "free" && !form.gender)
        errors.gender = "Please select your dormitory preference.";
    }

    if (step === 3 || isSubmit) {
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
    
    if (Object.keys(errors).length > 0) {
      // If we are validating for submit or step 3 and there are step 1 errors, jump back to step 1
      if ((isSubmit || step === 3) && (errors.firstName || errors.lastName || errors.email || errors.phone)) {
        setStep(1);
        setError("Please complete your personal details before continuing.");
      }
      return false;
    }
    
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setError(null);
    setStep((s) => {
      if (s === 2) {
        if (form.firstName.trim().length < 2 || !form.email) return 1;
      }
      return Math.min(4, s + 1);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validateStep(true)) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          idempotencyKey: idempotencyKeyRef.current,
          ticketTypeId: form.ticketTypeId || null,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          city: form.city,
          country: form.country,
          gender: form.gender || null,
          ageBracket: form.ageBracket || null,
          occupation: form.occupation || null,
          church: form.church,
          attendeeType: form.attendeeType,
          accommodation: form.accommodation,
          accommodationType: form.accommodation ? form.accommodationPreference : "none",
          transport: form.transport,
          dietary: form.dietary,
          emergencyName: form.emergencyName,
          emergencyPhone: form.emergencyPhone,
          donationAmount: form.donationAmount ? parseFloat(form.donationAmount) : undefined,
          customAnswers,
          followMinistry: form.followMinistry ?? true,
          guests: guests
            .filter((g) => g.firstName.trim().length > 0)
            .map((g) => ({
              firstName: g.firstName.trim(),
              lastName: g.lastName.trim() || form.lastName,
              email: g.email.trim() || undefined,
              phone: g.phone.trim() || undefined,
              ticketTypeId: g.ticketTypeId || form.ticketTypeId || null,
              relationship: g.relationship,
            })),
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

      if (data.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl;
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
        status: data.registration.status,
        allTickets: data.allTickets || [],
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
      setOtpError(null);
      
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
        phone={form.phone}
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
      <div className="card overflow-hidden">
        {/* Registration Mode Switcher Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.025] px-6 py-3.5 sm:px-9">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                isExpressMode
                  ? "bg-brass/20 text-brass border border-brass/35"
                  : "bg-white/10 text-warm-300"
              )}
            >
              <Zap size={13} className={isExpressMode ? "text-brass" : "text-warm-400"} />
              {isExpressMode ? "⚡ Express 1-Page Mode" : "Guided 4-Step Mode"}
            </span>
            <span className="text-xs text-warm-500 hidden sm:inline">
              {isExpressMode
                ? "Fast 20-second pass checkout"
                : "Step-by-step registration wizard"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsExpressMode(!isExpressMode);
              setError(null);
              setFieldErrors({});
            }}
            className="text-xs font-semibold text-brass-light hover:text-brass underline underline-offset-4 cursor-pointer transition-colors"
          >
            {isExpressMode
              ? "Switch to Guided 4-Step Mode"
              : "⚡ Switch to Express 1-Page Mode"}
          </button>
        </div>

        {isExpressMode ? (
          <ExpressRegistrationPanel
            event={event}
            tickets={tickets}
            form={form}
            update={update}
            fieldErrors={fieldErrors}
            guests={guests}
            addGuest={addGuest}
            updateGuest={updateGuest}
            removeGuest={removeGuest}
            selectedTicket={selectedTicket}
            totalBasePrice={totalBasePrice}
            convenienceFee={convenienceFee}
            passFee={passFee}
            grandTotal={grandTotal}
            error={error}
            submitting={submitting}
            submit={submit}
          />
        ) : (
          <>
            {/* Stepper */}
            <div className="border-b border-white/10 px-6 pt-7 pb-6 sm:px-9">
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
                      ? "border-transparent bg-brass text-black"
                      : s.n < step
                        ? "border-brass/30 bg-brass/10 text-brass"
                        : "border-white/10 bg-transparent text-warm-500"
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
                    <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full bg-white/10">
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
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            className="btn btn-primary w-full justify-center"
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otpCode.length < 6}
                          >
                            {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify Code"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary w-full justify-center"
                            onClick={handleRequestOTP}
                            disabled={otpLoading}
                          >
                            {otpLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Resend Code"}
                          </button>
                        </div>
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
                        className="input bg-[rgba(255,255,255,0.03)] text-warm-400 border-transparent shadow-none"
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

                    {event.collectGender && (
                      <Field label="Gender" required error={fieldErrors.gender}>
                        <select
                          className="input"
                          value={form.gender}
                          onChange={(e) => update("gender", e.target.value)}
                          aria-invalid={Boolean(fieldErrors.gender)}
                        >
                          <option value="">Select gender...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </Field>
                    )}
                  </>
                )}
              </div>

              {/* Group & Family Multi-Registration Section */}
              <div className="mt-8 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(192,138,46,0.15)] text-[var(--color-brass)] border border-[rgba(192,138,46,0.3)]">
                      <Users size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink text-sm">
                        Registering Family, Spouse, or Team Members?
                      </h3>
                      <p className="text-xs text-warm-500">
                        Add guests now to register everyone together in one checkout.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addGuest}
                    disabled={guests.length >= 6}
                    className="btn btn-ghost !py-1.5 !px-3 !text-xs cursor-pointer border border-white/10 hover:border-brass/40"
                  >
                    <UserPlus size={14} className="text-brass" />
                    + Add Guest / Family ({guests.length}/6)
                  </button>
                </div>

                {guests.length > 0 && (
                  <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
                    {guests.map((g, idx) => (
                      <div
                        key={g.id}
                        className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brass flex items-center gap-1.5">
                            Guest #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeGuest(g.id)}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label="First name"
                            required
                            error={fieldErrors[`guest_${g.id}_name`]}
                          >
                            <input
                              className="input !text-xs !py-2"
                              value={g.firstName}
                              onChange={(e) => updateGuest(g.id, "firstName", e.target.value)}
                              placeholder="Guest's first name"
                            />
                          </Field>
                          <Field label="Last name">
                            <input
                              className="input !text-xs !py-2"
                              value={g.lastName}
                              onChange={(e) => updateGuest(g.id, "lastName", e.target.value)}
                              placeholder={form.lastName || "Guest's surname"}
                            />
                          </Field>
                          <Field label="Relationship / Role">
                            <select
                              className="input !text-xs !py-2"
                              value={g.relationship}
                              onChange={(e) => updateGuest(g.id, "relationship", e.target.value)}
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child / Dependant">Child / Dependant</option>
                              <option value="Family Member">Family Member</option>
                              <option value="Choir / Department Member">Choir / Department Member</option>
                              <option value="Friend / Guest">Friend / Guest</option>
                            </select>
                          </Field>
                          {tickets.length > 1 ? (
                            <Field label="Ticket package">
                              <select
                                className="input !text-xs !py-2"
                                value={g.ticketTypeId}
                                onChange={(e) => updateGuest(g.id, "ticketTypeId", e.target.value)}
                              >
                                {tickets.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.price > 0 ? `(${formatMoney(t.price, t.currency)})` : "(Free)"}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          ) : (
                            <Field label="Email (Optional)">
                              <input
                                className="input !text-xs !py-2"
                                type="email"
                                value={g.email}
                                onChange={(e) => updateGuest(g.id, "email", e.target.value)}
                                placeholder="Defaults to your email"
                              />
                            </Field>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
                      <div
                        key={ticket.id}
                        role="radio"
                        aria-checked={active}
                        tabIndex={0}
                        onClick={() => update("ticketTypeId", ticket.id)}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' || e.key === ' ') {
                             e.preventDefault();
                             update("ticketTypeId", ticket.id);
                           }
                        }}
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-[13px] border p-5 transition-colors",
                          active
                            ? "border-[var(--color-brass-deep)] bg-[rgba(226,192,115,0.09)]"
                            : "border-[rgba(255,255,255,0.13)] bg-paper hover:border-[rgba(226,192,115,0.5)]"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                            active
                              ? "border-[var(--color-brass-deep)]"
                              : "border-[rgba(255,255,255,0.24)]"
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
                              : "Waitlist available"}
                          </span>
                        </span>
                        <span className="tnum shrink-0 text-[1.02rem] font-semibold text-ink">
                          {ticket.price === 0
                            ? "Free"
                            : formatMoney(ticket.price, ticket.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {tickets.find((t) => t.id === form.ticketTypeId)?.isDonation && (
                <div className="mt-8">
                  <Field label="Name your price (Optional)" hint={`Minimum is ${formatMoney(tickets.find((t) => t.id === form.ticketTypeId)!.price, tickets.find((t) => t.id === form.ticketTypeId)!.currency)}`}>
                    <input
                      type="number"
                      min={tickets.find((t) => t.id === form.ticketTypeId)?.price || 0}
                      className="input"
                      value={form.donationAmount}
                      onChange={(e) => update("donationAmount", e.target.value)}
                      placeholder="Enter amount"
                    />
                  </Field>
                </div>
              )}

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="I am attending as">
                  <select
                    className="input"
                    value={form.attendeeType}
                    onChange={(e) => update("attendeeType", e.target.value)}
                  >
                    {(event.attendeeTypes || ["Delegate", "Student", "Minister / clergy", "Volunteer", "Speaker", "Guest"]).map((type) => (
                      <option key={type} value={type.toLowerCase()}>{type}</option>
                    ))}
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

                {event.collectAgeBracket && (
                  <Field label="Age bracket" required error={fieldErrors.ageBracket}>
                    <select
                      className="input"
                      value={form.ageBracket}
                      onChange={(e) => update("ageBracket", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.ageBracket)}
                    >
                      <option value="">Select age bracket...</option>
                      <option value="under_18">Under 18</option>
                      <option value="18-24">18–24 years</option>
                      <option value="25-34">25–34 years</option>
                      <option value="35-49">35–49 years</option>
                      <option value="50+">50+ years</option>
                    </select>
                  </Field>
                )}

                {event.collectOccupation && (
                  <Field label="Employment status / Occupation" required error={fieldErrors.occupation}>
                    <select
                      className="input"
                      value={form.occupation}
                      onChange={(e) => update("occupation", e.target.value)}
                      aria-invalid={Boolean(fieldErrors.occupation)}
                    >
                      <option value="">Select employment status...</option>
                      <option value="employed">Employed (Full-time / Part-time)</option>
                      <option value="self_employed">Self-Employed / Business Owner</option>
                      <option value="student">Student</option>
                      <option value="job_seeker">Job Seeker / In transition</option>
                      <option value="other">Retired / Other</option>
                    </select>
                  </Field>
                )}
              </div>

              {/* Accommodation section based on event setting */}
              <div className="mt-7 space-y-3">
                {event.accommodationMode === "both" ? (
                  <div className="rounded-[14px] border border-[rgba(255,255,255,0.13)] bg-paper p-5">
                    <label className="block text-[0.905rem] font-semibold text-ink">
                      Accommodation / Lodging
                    </label>
                    <p className="mt-1 text-[0.825rem] text-warm-500 leading-relaxed">
                      This event offers free camp hostel lodging, as well as paid executive room / hotel packages.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-colors ${form.accommodationPreference === "none" ? "border-[var(--color-brass-deep)] bg-[rgba(226,192,115,0.08)]" : "border-[rgba(255,255,255,0.1)] bg-white/5 hover:border-white/20"}`}>
                        <div className="flex items-center gap-2 text-[0.845rem] font-medium text-ink">
                          <input
                            type="radio"
                            name="accPreference"
                            checked={form.accommodationPreference === "none"}
                            onChange={() => {
                              update("accommodationPreference", "none");
                              update("accommodation", false);
                            }}
                            className="accent-[var(--color-brass-deep)]"
                          />
                          None (Day Attendee)
                        </div>
                        <p className="mt-2 text-[0.765rem] text-warm-500 leading-snug">
                          I live nearby or will commute daily.
                        </p>
                      </label>

                      <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-colors ${form.accommodationPreference === "free" ? "border-[var(--color-brass-deep)] bg-[rgba(226,192,115,0.08)]" : "border-[rgba(255,255,255,0.1)] bg-white/5 hover:border-white/20"}`}>
                        <div className="flex items-center gap-2 text-[0.845rem] font-medium text-ink">
                          <input
                            type="radio"
                            name="accPreference"
                            checked={form.accommodationPreference === "free"}
                            onChange={() => {
                              update("accommodationPreference", "free");
                              update("accommodation", true);
                            }}
                            className="accent-[var(--color-brass-deep)]"
                          />
                          Free Camp Dormitory
                        </div>
                        <p className="mt-2 text-[0.765rem] text-warm-500 leading-snug">
                          Ministry hostel bed provided (Brother&apos;s or Sister&apos;s dorm).
                        </p>
                      </label>

                      <label className={`flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-colors ${form.accommodationPreference === "paid" ? "border-[var(--color-brass-deep)] bg-[rgba(226,192,115,0.08)]" : "border-[rgba(255,255,255,0.1)] bg-white/5 hover:border-white/20"}`}>
                        <div className="flex items-center gap-2 text-[0.845rem] font-medium text-ink">
                          <input
                            type="radio"
                            name="accPreference"
                            checked={form.accommodationPreference === "paid"}
                            onChange={() => {
                              update("accommodationPreference", "paid");
                              update("accommodation", true);
                            }}
                            className="accent-[var(--color-brass-deep)]"
                          />
                          Paid Executive Room
                        </div>
                        <p className="mt-2 text-[0.765rem] text-warm-500 leading-snug">
                          Private room / hotel upgrade via ticket packages.
                        </p>
                      </label>
                    </div>

                    {form.accommodationPreference === "free" && !event.collectGender && (
                      <div className="mt-4 rounded-[12px] border border-[var(--color-brass)]/30 bg-[rgba(226,192,115,0.08)] p-3.5">
                        <Field
                          label="Hostel / Dormitory Allocation"
                          required
                          error={fieldErrors.gender}
                          hint="Dormitories are strictly segregated by gender."
                        >
                          <select
                            className="input bg-white"
                            value={form.gender}
                            onChange={(e) => update("gender", e.target.value)}
                          >
                            <option value="">Select dorm preference...</option>
                            <option value="male">Brother&apos;s Dormitory (Male)</option>
                            <option value="female">Sister&apos;s Dormitory (Female)</option>
                          </select>
                        </Field>
                      </div>
                    )}

                    {form.accommodationPreference === "paid" && (
                      <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-[var(--color-brass)]/25 bg-[rgba(226,192,115,0.08)] p-3.5">
                        <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-brass)]" />
                        <p className="text-[0.795rem] text-warm-600 leading-relaxed">
                          Please ensure you have selected a ticket tier above that includes lodging, or confirm your private booking with the welfare hospitality desk upon arrival.
                        </p>
                      </div>
                    )}
                  </div>
                ) : event.accommodationMode === "free" ? (
                  <>
                    <Toggle
                      checked={form.accommodation}
                      onChange={(v) => {
                        update("accommodation", v);
                        update("accommodationPreference", v ? "free" : "none");
                      }}
                      title="I need accommodation (Free camp / dormitory lodging)"
                      body="Hostel or dormitory lodging provided by the ministry. Room assignments will be confirmed upon arrival."
                    />
                    {form.accommodation && !event.collectGender && (
                      <div className="rounded-[12px] border border-[var(--color-brass)]/30 bg-[rgba(226,192,115,0.08)] p-4">
                        <Field
                          label="Hostel / Dormitory Allocation"
                          required
                          error={fieldErrors.gender}
                          hint="Dormitories are strictly segregated by gender."
                        >
                          <select
                            className="input bg-white"
                            value={form.gender}
                            onChange={(e) => update("gender", e.target.value)}
                          >
                            <option value="">Select dorm preference...</option>
                            <option value="male">Brother&apos;s Dormitory (Male)</option>
                            <option value="female">Sister&apos;s Dormitory (Female)</option>
                          </select>
                        </Field>
                      </div>
                    )}
                  </>
                ) : event.accommodationMode === "paid" ? (
                  <div className="flex items-start gap-3 rounded-[13px] border border-[var(--color-brass)]/25 bg-[rgba(226,192,115,0.08)] p-4">
                    <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-brass)]" />
                    <div>
                      <p className="text-[0.845rem] font-semibold text-ink">
                        Accommodation is handled via Ticket Packages
                      </p>
                      <p className="mt-0.5 text-[0.8rem] text-warm-600 leading-relaxed">
                        To book accommodation, please select a ticket tier above that includes lodging, or contact the event host for partner hotel rates.
                      </p>
                    </div>
                  </div>
                ) : null}

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
                <div className="mt-8 border-t border-white/10 pt-8">
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

              <div className="mt-8 rounded-[13px] border border-[rgba(226,192,115,0.28)] bg-[rgba(226,192,115,0.07)] p-5">
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

                {/* Auto-Follow Ministry Checkbox */}
                <div className="mt-5 rounded-xl border border-brass/25 bg-brass/5 p-4">
                  <label className="flex cursor-pointer items-start gap-3.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[var(--color-brass-deep)]"
                      checked={form.followMinistry ?? true}
                      onChange={(e) => update("followMinistry", e.target.checked)}
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-ink block">
                        Stay connected with this ministry on Selah
                      </span>
                      <span className="text-warm-500 block mt-0.5 leading-relaxed">
                        Receive weekly spiritual devotionals, pastoral words, and priority gate passes directly. No separate account or password required.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <StepHeading
                title="Review and confirm"
                subtitle="Check the details below — you can go back to change anything."
              />

              <dl className="mt-7 overflow-hidden rounded-[13px] border border-[rgba(255,255,255,0.11)]">
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
                  form.gender ? ["Gender", form.gender === "male" ? "Male" : "Female"] : null,
                  form.ageBracket ? ["Age bracket", form.ageBracket.replace("_", " ")] : null,
                  form.occupation ? ["Occupation", form.occupation.replace("_", " ")] : null,
                  ["Church / organisation", form.church || "—"],
                  ["Ticket", selectedTicket?.name ?? "—"],
                  [
                    "Hospitality",
                    [
                      form.accommodation
                        ? form.accommodationPreference === "paid"
                          ? "Paid Executive / Hotel Lodging"
                          : form.accommodationPreference === "free"
                            ? `Free Camp Dorm (${form.gender === "male" ? "Brother's Dorm" : "Sister's Dorm"})`
                            : "Accommodation Requested"
                        : null,
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
                ].filter((item): item is [string, string] => Boolean(item)).map(([term, value], i) => (
                  <div
                    key={term}
                    className={cn(
                      "flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                      i % 2 === 0
                        ? "bg-[rgba(255,255,255,0.028)]"
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

              <div className="mt-6 rounded-[13px] border border-[rgba(255,255,255,0.11)] bg-[rgba(226,192,115,0.08)] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="eyebrow text-[0.565rem] text-warm-500">
                      Total due
                    </div>
                    <div className="tnum font-display mt-1.5 text-[1.85rem] leading-none font-semibold text-ink">
                      {grandTotal === 0
                        ? "Free"
                        : formatMoney(
                            grandTotal,
                            selectedTicket?.currency ?? "NGN"
                          )}
                    </div>
                  </div>
                  <p className="max-w-[20rem] text-[0.795rem] leading-[1.68] text-warm-600">
                    {grandTotal === 0
                      ? "No payment is required. You'll receive your tickets immediately after confirming."
                      : "You'll be shown the secure payment step after confirming. Card details are never handled by Selah."}
                  </p>
                </div>

                {grandTotal > 0 && (
                  <div className="pt-3 border-t border-white/10 text-xs space-y-1.5">
                    <div className="flex justify-between text-warm-500">
                      <span>
                        Ticket subtotal ({1 + guests.length} {1 + guests.length === 1 ? "pass" : "passes"}):
                      </span>
                      <span className="font-medium text-ink">
                        {formatMoney(totalBasePrice, selectedTicket?.currency ?? "NGN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-warm-500">
                      <span className="flex items-center gap-1.5">
                        Payment processing fee:
                        {passFee && (
                          <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[0.65rem] font-semibold text-emerald-400">
                            ✨ Church receives 100%
                          </span>
                        )}
                      </span>
                      <span className="font-medium text-ink">
                        {convenienceFee > 0
                          ? formatMoney(convenienceFee, selectedTicket?.currency ?? "NGN")
                          : "Covered by organizer"}
                      </span>
                    </div>
                  </div>
                )}
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
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 bg-[rgba(255,255,255,0.022)] px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-9">
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
          </>
        )}
      </div>

      {/* Summary rail */}
      <aside className="space-y-6">
        <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.11)] bg-cypress text-parchment">
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
              <div className="flex items-start gap-2.5 text-[0.845rem] text-[rgba(255,255,255,0.78)]">
                <Ticket size={15} className="mt-0.5 shrink-0 text-brass-light" />
                {formatRange(event.startsAt, event.endsAt)} ·{" "}
                {formatTime(event.startsAt)}
              </div>
              <div className="flex items-start gap-2.5 text-[0.845rem] text-[rgba(255,255,255,0.78)]">
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
                {grandTotal === 0
                  ? "Free"
                  : formatMoney(
                      grandTotal,
                      selectedTicket?.currency ?? "NGN"
                    )}
              </div>
            </div>
            {!isExpressMode && step !== 2 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-[0.795rem] font-semibold text-[var(--color-brass-deep)] underline underline-offset-4"
              >
                Change
              </button>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
            <div className="flex justify-between text-warm-500">
              <span>Attendees:</span>
              <span className="font-medium text-ink">
                1 Primary {guests.length > 0 ? `+ ${guests.length} guest${guests.length > 1 ? "s" : ""}` : ""}
              </span>
            </div>
            {totalBasePrice > 0 && (
              <div className="flex justify-between text-warm-500">
                <span>Subtotal:</span>
                <span className="font-medium text-ink">
                  {formatMoney(totalBasePrice, selectedTicket?.currency ?? "NGN")}
                </span>
              </div>
            )}
            {convenienceFee > 0 && (
              <div className="flex justify-between text-warm-500">
                <span className="flex items-center gap-1">
                  Payment Fee:
                  {passFee && (
                    <span className="text-[0.62rem] text-emerald-400 font-semibold">
                      (100% to church)
                    </span>
                  )}
                </span>
                <span className="font-medium text-ink">
                  {formatMoney(convenienceFee, selectedTicket?.currency ?? "NGN")}
                </span>
              </div>
            )}
            {grandTotal > 0 && (
              <div className="flex justify-between pt-2 border-t border-white/5 font-semibold text-ink text-sm">
                <span>Total Due:</span>
                <span className="text-brass">
                  {formatMoney(grandTotal, selectedTicket?.currency ?? "NGN")}
                </span>
              </div>
            )}
          </div>

          {selectedTicket?.benefits?.length ? (
            <ul className="mt-5 space-y-2 border-t border-[rgba(255,255,255,0.09)] pt-5">
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

        <div className="flex items-start gap-3 rounded-[13px] border border-[rgba(255,255,255,0.11)] bg-paper p-5">
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
          ? "border-[var(--color-brass-deep)] bg-[rgba(226,192,115,0.08)]"
          : "border-[rgba(255,255,255,0.13)] bg-paper"
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
          checked ? "bg-[var(--color-brass-deep)]" : "bg-[rgba(255,255,255,0.18)]"
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
  phone,
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
    status?: string;
    allTickets?: Array<{
      code: string;
      ticketCode: string;
      name: string;
      ticketName: string;
      email?: string;
      relationship?: string | null;
    }>;
  };
  email: string;
  phone?: string;
}) {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://selahevent.vercel.app";

  const whatsappUrl = generateWhatsAppTicketLink({
    phone: phone || null,
    eventTitle: event.title,
    attendeeName: confirmation.name,
    ticketCode: confirmation.ticketCode,
    ticketTier: confirmation.ticketName,
    venueName: event.venueName,
    eventDate: formatRange(event.startsAt, event.endsAt),
    passUrl: `${siteUrl}/my-tickets/${confirmation.ticketCode}`,
  });

  return (
    <div className="mx-auto max-w-[54rem]">
      <div className="card overflow-hidden">
        <div className="relative overflow-hidden bg-cypress px-7 py-12 text-center text-parchment sm:px-12">
          <div className="grain pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[rgba(232,211,166,0.4)] bg-[rgba(232,211,166,0.16)]">
              <CheckCircle2 size={30} className="text-brass-light" />
            </span>
            <h2 className="font-display mt-6 text-[clamp(2rem,4.5vw,2.85rem)] leading-[1.08] font-semibold">
              {confirmation.status === "waitlisted" ? "You're on the waitlist." : "You're registered."}
            </h2>
            <p className="mx-auto mt-4 max-w-[30rem] text-[1.025rem] leading-[1.72] text-[rgba(255,255,255,0.82)]">
              {confirmation.status === "waitlisted" ? (
                <>
                  A confirmation has been prepared for <strong className="font-semibold text-brass-light">{email}</strong>. 
                  You will be notified if a spot opens up for this event.
                </>
              ) : (
                <>
                  A confirmation has been prepared for <strong className="font-semibold text-brass-light">{email}</strong>.
                  Your ticket code is <strong className="tnum font-semibold text-brass-light">{confirmation.code}</strong>.
                </>
              )}
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
                  className="flex flex-col gap-1 border-t border-white/10 py-3.5 sm:flex-row sm:items-center sm:justify-between"
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

            {/* Instant WhatsApp Delivery Banner */}
            <div className="mt-8 rounded-[16px] border border-emerald-600/30 bg-gradient-to-br from-emerald-500/[0.09] to-emerald-500/[0.03] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm ring-4 ring-emerald-500/15">
                    <MessageSquare size={22} />
                  </div>
                  <div>
                    <h4 className="text-[0.935rem] font-semibold text-ink">
                      Save Pass to WhatsApp
                    </h4>
                    <p className="mt-0.5 text-[0.825rem] leading-snug text-warm-500">
                      Tap below to receive your digital badge, seat details, and QR entrance pass directly into WhatsApp.
                    </p>
                  </div>
                </div>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-[0.875rem] font-semibold text-white shadow-sm transition-all hover:bg-[#20ba5a] hover:shadow-md active:scale-[0.98]"
                >
                  <MessageSquare size={16} /> Save to WhatsApp
                </a>
              </div>
            </div>

            {/* Group & Family Passes Roster (if multiple people registered) */}
            {confirmation.allTickets && confirmation.allTickets.length > 1 && (
              <div className="mt-8 rounded-xl border border-[rgba(192,138,46,0.3)] bg-[rgba(192,138,46,0.06)] p-5">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <Users size={18} className="text-[var(--color-brass)]" />
                  <h4 className="font-semibold text-ink text-sm">
                    Family &amp; Group Passes ({confirmation.allTickets.length} Attendees Registered)
                  </h4>
                </div>
                <div className="space-y-3">
                  {confirmation.allTickets.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-xl border border-white/10 bg-black/30 gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-ink text-sm truncate">{t.name}</span>
                          {t.relationship && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[0.6875rem] text-warm-400">
                              {t.relationship}
                            </span>
                          )}
                        </div>
                        <span className="text-[0.75rem] text-warm-400 block mt-0.5">
                          {t.ticketName} • Pass Code: <strong className="text-brass">{t.ticketCode}</strong>
                        </span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <SaveTicketImageButton
                          ticket={{
                            eventTitle: event.title,
                            attendeeName: t.name,
                            ticketCode: t.ticketCode,
                            ticketTier: t.ticketName,
                            qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SELAH:${t.ticketCode}`,
                            dateStr: formatRange(event.startsAt, event.endsAt),
                            venueName: event.venueName || event.city,
                          }}
                          className="!py-1.5 !px-3 !text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <SaveTicketImageButton
                ticket={{
                  eventTitle: event.title,
                  attendeeName: confirmation.name,
                  ticketCode: confirmation.ticketCode,
                  ticketTier: confirmation.ticketName,
                  qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SELAH:${confirmation.ticketCode}`,
                  dateStr: formatRange(event.startsAt, event.endsAt),
                  venueName: event.venueName || event.city,
                }}
                className="btn btn-primary"
              />
              <a
                href={`data:text/calendar;charset=utf-8,${encodeURIComponent(
                  buildIcs(event)
                )}`}
                download={`${event.slug}.ics`}
                className="btn btn-ghost"
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
                <Download size={16} /> Print confirmation
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 border-t border-white/10 bg-[rgba(226,192,115,0.07)] px-8 py-10 md:border-t-0 md:border-l">
            <div className="rounded-[14px] border border-[rgba(255,255,255,0.12)] bg-white p-4">
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
                Show this turnstile code at the venue gate for instant check-in.
              </p>
            </div>

            <div className="mt-1 flex w-full flex-col gap-2">
              <SaveTicketImageButton
                ticket={{
                  eventTitle: event.title,
                  attendeeName: confirmation.name,
                  ticketCode: confirmation.ticketCode,
                  ticketTier: confirmation.ticketName,
                  qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SELAH:${confirmation.ticketCode}`,
                  dateStr: formatRange(event.startsAt, event.endsAt),
                  venueName: event.venueName || event.city,
                }}
                className="w-full justify-center !py-2.5 !text-[0.825rem]"
              />
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-[0.845rem] font-semibold text-white shadow-sm transition-all hover:bg-[#20ba5a]"
              >
                <MessageSquare size={16} /> Save to WhatsApp
              </a>
              <a
                href={`/api/tickets/${confirmation.ticketCode}/pdf`}
                download
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/60 px-4 py-2 text-[0.825rem] font-medium text-ink transition-all hover:bg-white"
              >
                <Download size={14} /> Download PDF Ticket
              </a>
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
    </div>
  );
}

function ExpressRegistrationPanel({
  event,
  tickets,
  form,
  update,
  fieldErrors,
  guests,
  addGuest,
  updateGuest,
  removeGuest,
  selectedTicket,
  totalBasePrice,
  convenienceFee,
  passFee,
  grandTotal,
  error,
  submitting,
  submit,
}: {
  event: EventSummary;
  tickets: TicketOption[];
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  fieldErrors: Record<string, string>;
  guests: GuestFormItem[];
  addGuest: () => void;
  updateGuest: (id: string, field: keyof GuestFormItem, value: string) => void;
  removeGuest: (id: string) => void;
  selectedTicket: TicketOption | undefined;
  totalBasePrice: number;
  convenienceFee: number;
  passFee: boolean;
  grandTotal: number;
  error: string | null;
  submitting: boolean;
  submit: () => void;
}) {
  return (
    <div className="px-6 py-8 sm:px-9 space-y-8">
      {/* Express Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brass/15 px-3 py-1 text-xs font-semibold text-brass border border-brass/30">
          <Zap size={13} />
          Express Fast-Lane Checkout (20s)
        </div>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-ink">
          Quick Pass Registration
        </h2>
        <p className="mt-1 text-sm text-warm-500">
          Single-page checkout for fast registration. Complete your details below to receive your ticket and QR badge instantly.
        </p>
      </div>

      {/* Ticket Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400">
            1. Select Ticket Tier
          </h3>
          <span className="text-xs text-warm-500">
            {tickets.length} tier{tickets.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {tickets.map((t) => {
            const isSelected = form.ticketTypeId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => update("ticketTypeId", t.id)}
                className={cn(
                  "flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer relative",
                  isSelected
                    ? "border-brass bg-brass/10 ring-1 ring-brass shadow-sm"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-ink text-sm sm:text-base">{t.name}</span>
                  <span className="font-bold text-brass text-sm">
                    {t.price === 0 ? "Free" : formatMoney(t.price, t.currency)}
                  </span>
                </div>
                {t.description && (
                  <p className="mt-1.5 text-xs text-warm-500 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                )}
                {t.badge && (
                  <span className="mt-2.5 inline-block self-start text-[0.65rem] font-semibold bg-white/10 px-2 py-0.5 rounded text-warm-300">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Personal Details */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-warm-400">
          2. Your Details
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required error={fieldErrors.firstName}>
            <input
              className="input"
              value={form.firstName}
              autoComplete="given-name"
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="e.g. John"
            />
          </Field>
          <Field label="Last name" required error={fieldErrors.lastName}>
            <input
              className="input"
              value={form.lastName}
              autoComplete="family-name"
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="e.g. Doe"
            />
          </Field>
          <Field label="Email address" required error={fieldErrors.email} hint="Your ticket QR code will be sent here">
            <input
              className="input"
              type="email"
              value={form.email}
              autoComplete="email"
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone / WhatsApp" required error={fieldErrors.phone} hint="For instant check-in pass delivery">
            <input
              className="input"
              type="tel"
              value={form.phone}
              autoComplete="tel"
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+234 801 234 5678"
            />
          </Field>
          <Field label="Church / Ministry (optional)">
            <input
              className="input"
              value={form.church}
              onChange={(e) => update("church", e.target.value)}
              placeholder="e.g. City of God Fellowship"
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
          {event.collectGender && (
            <Field label="Gender" required error={fieldErrors.gender}>
              <select
                className="input"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
              >
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
          )}
        </div>
      </div>

      {/* Group & Family Quick Add */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/15 text-brass border border-brass/30">
              <Users size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-ink text-sm">
                Bringing Family or Guests?
              </h4>
              <p className="text-xs text-warm-500">
                Register up to 6 companions in one fast checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={addGuest}
            disabled={guests.length >= 6}
            className="btn btn-ghost !py-1.5 !px-3 !text-xs cursor-pointer border border-white/10 hover:border-brass/40"
          >
            <UserPlus size={14} className="text-brass" />
            + Add Guest ({guests.length}/6)
          </button>
        </div>

        {guests.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            {guests.map((g, idx) => (
              <div
                key={g.id}
                className="rounded-lg border border-white/10 bg-paper/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brass uppercase tracking-wider">
                    Guest #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeGuest(g.id)}
                    className="text-warm-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="First Name" required error={fieldErrors[`guest_${g.id}_name`]}>
                    <input
                      className="input !py-1.5 !text-sm"
                      value={g.firstName}
                      onChange={(e) => updateGuest(g.id, "firstName", e.target.value)}
                      placeholder="e.g. Mary"
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      className="input !py-1.5 !text-sm"
                      value={g.lastName}
                      onChange={(e) => updateGuest(g.id, "lastName", e.target.value)}
                      placeholder={form.lastName || "e.g. Doe"}
                    />
                  </Field>
                  <Field label="Relationship">
                    <select
                      className="input !py-1.5 !text-sm"
                      value={g.relationship}
                      onChange={(e) => updateGuest(g.id, "relationship", e.target.value)}
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Family Member">Family Member</option>
                      <option value="Choir / Ministry Member">Choir / Ministry Member</option>
                      <option value="Friend">Friend</option>
                    </select>
                  </Field>
                  {tickets.length > 1 && (
                    <Field label="Ticket Tier">
                      <select
                        className="input !py-1.5 !text-sm"
                        value={g.ticketTypeId}
                        onChange={(e) => updateGuest(g.id, "ticketTypeId", e.target.value)}
                      >
                        {tickets.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.price === 0 ? "Free" : formatMoney(t.price, t.currency)})
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accommodation Note if available */}
      {event.accommodationMode !== "none" && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox mt-0.5"
              checked={form.accommodation}
              onChange={(e) => update("accommodation", e.target.checked)}
            />
            <div className="text-xs">
              <span className="font-semibold text-ink block">
                I require camp dormitory / lodging accommodation
              </span>
              <span className="text-warm-500 block mt-0.5">
                Our protocol team will assign you to {form.gender === "female" ? "Sister's Dorm" : "Brother's Dorm"} on check-in.
              </span>
            </div>
          </label>
        </div>
      )}

      {/* Consent Notice */}
      <div className="rounded-xl border border-white/10 bg-paper p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox mt-0.5"
            checked={form.consent}
            onChange={(e) => update("consent", e.target.checked)}
          />
          <div className="text-xs">
            <span className="font-medium text-ink block">
              I agree to the event privacy notice and verify that details provided are accurate.
            </span>
            {fieldErrors.consent && (
              <span className="text-[var(--color-signal-red)] font-semibold mt-1 flex items-center gap-1">
                <Info size={12} /> {fieldErrors.consent}
              </span>
            )}
          </div>
        </label>
      </div>

      {/* Auto-Follow Ministry Checkbox */}
      <div className="rounded-xl border border-brass/25 bg-brass/5 p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="checkbox mt-0.5"
            checked={form.followMinistry ?? true}
            onChange={(e) => update("followMinistry", e.target.checked)}
          />
          <div className="text-xs">
            <span className="font-semibold text-ink block">
              Follow this host ministry on Selah
            </span>
            <span className="text-warm-500 block mt-0.5 leading-relaxed">
              Receive weekly pastoral bulletins, meditation scriptures, and priority passes directly.
            </span>
          </div>
        </label>
      </div>

      {/* Pricing and Submit Section */}
      <div className="rounded-xl border border-white/10 bg-brass/5 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[0.68rem] uppercase font-bold tracking-wider text-warm-500">
              Total Amount Due
            </div>
            <div className="tnum font-display text-2xl sm:text-3xl font-semibold text-ink mt-0.5">
              {grandTotal === 0
                ? "Free"
                : formatMoney(grandTotal, selectedTicket?.currency ?? "NGN")}
            </div>
          </div>
          <div className="text-right text-xs text-warm-500">
            <span>{1 + guests.length} Pass{1 + guests.length > 1 ? "es" : ""}</span>
            {passFee && grandTotal > 0 && (
              <span className="block text-emerald-400 font-semibold mt-0.5">
                ✨ Church receives 100%
              </span>
            )}
          </div>
        </div>

        {grandTotal > 0 && (
          <div className="pt-3 border-t border-white/10 text-xs space-y-1 text-warm-500">
            <div className="flex justify-between">
              <span>Ticket Subtotal:</span>
              <span className="text-ink font-medium">
                {formatMoney(totalBasePrice, selectedTicket?.currency ?? "NGN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Fee:</span>
              <span className="text-ink font-medium">
                {convenienceFee > 0
                  ? formatMoney(convenienceFee, selectedTicket?.currency ?? "NGN")
                  : "Covered by organizer"}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-[rgba(164,64,47,0.3)] bg-[rgba(164,64,47,0.1)] p-3 text-xs text-[var(--color-signal-red)]">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="btn btn-brass w-full !py-3.5 !text-base font-semibold shadow-lg shadow-brass/20 cursor-pointer justify-center"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Issuing Express Pass…
            </>
          ) : (
            <>
              <Zap size={18} />
              {grandTotal === 0
                ? "Confirm & Get Instant Pass"
                : `Pay ${formatMoney(grandTotal, selectedTicket?.currency ?? "NGN")} & Get Pass`}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
