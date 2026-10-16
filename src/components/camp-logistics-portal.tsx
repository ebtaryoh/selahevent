"use client";

import React, { useState } from "react";
import {
  Bus,
  BedDouble,
  Utensils,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Users,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
} from "lucide-react";

export interface ShuttleItem {
  id: string;
  routeTitle: string;
  pickupLocation: string;
  departureTime: string;
  returnTime?: string;
  busCaptainName: string;
  busCaptainPhone: string;
  totalSeats: number;
  bookedSeats: number;
  fare: number;
  instructions: string;
}

export interface AccommodationItem {
  id: string;
  name: string;
  category: "male" | "female" | "couples" | "ministers" | "general" | string;
  location: string;
  totalBeds: number;
  allocatedBeds: number;
  checkInInstructions: string;
}

interface Props {
  eventId: string;
  eventTitle: string;
  shuttles: ShuttleItem[];
  accommodations: AccommodationItem[];
}

export function CampLogisticsPortal({
  eventId,
  eventTitle,
  shuttles = [],
  accommodations = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<"shuttles" | "accommodations" | "welfare">("shuttles");

  // Booking modal state
  const [selectedShuttle, setSelectedShuttle] = useState<ShuttleItem | null>(null);
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    seatCount: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<{
    code: string;
    message: string;
  } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleBookSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShuttle) return;

    setSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch(`/api/events/${eventId}/logistics/shuttles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "book_seat",
          shuttleId: selectedShuttle.id,
          attendeeName: bookingForm.name,
          attendeeEmail: bookingForm.email,
          attendeePhone: bookingForm.phone,
          seatCount: bookingForm.seatCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setBookingError(data.error || "Failed to reserve seat");
        return;
      }

      setBookingSuccess({
        code: data.booking.bookingCode,
        message: data.message,
      });

      // Update seat count locally
      selectedShuttle.bookedSeats += bookingForm.seatCount;
    } catch {
      setBookingError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="logistics" className="py-20 border-t border-[rgba(232,211,166,0.12)] bg-[#051410] text-parchment relative">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brass font-semibold">
              <Bus size={14} /> Camp Operations &amp; Hospitality
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold mt-2 text-white">
              Logistics, Hostels &amp; Bus Shuttles
            </h2>
            <p className="mt-3 text-warm-300 max-w-xl text-sm leading-relaxed">
              Plan your convention journey seamlessly. Coordinate official bus pickups across major city hubs, review camp hostel arrangements, and cafeteria meal sessions.
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/40 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("shuttles")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "shuttles"
                  ? "bg-brass text-ink shadow-md"
                  : "text-warm-400 hover:text-white"
              }`}
            >
              <Bus size={14} /> Shuttles ({shuttles.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("accommodations")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "accommodations"
                  ? "bg-brass text-ink shadow-md"
                  : "text-warm-400 hover:text-white"
              }`}
            >
              <BedDouble size={14} /> Hostels &amp; Halls ({accommodations.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("welfare")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "welfare"
                  ? "bg-brass text-ink shadow-md"
                  : "text-warm-400 hover:text-white"
              }`}
            >
              <Utensils size={14} /> Cafeteria &amp; Welfare
            </button>
          </div>
        </div>

        {/* TAB 1: BUS SHUTTLES */}
        {activeTab === "shuttles" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shuttles.length === 0 ? (
              <div className="col-span-full py-12 text-center text-warm-400 text-sm">
                No shuttle routes have been announced yet. Check back closer to the event.
              </div>
            ) : (
              shuttles.map((s) => {
                const remaining = Math.max(0, s.totalSeats - s.bookedSeats);
                const isFull = s.totalSeats > 0 && remaining === 0;

                return (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-white/10 bg-[#0a231b] p-6 flex flex-col justify-between hover:border-brass/40 transition-colors shadow-lg"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-sky-950/40 text-sky-300 border-sky-500/30">
                          {s.fare === 0 ? "Free Church Shuttle" : `₦${s.fare.toLocaleString()}`}
                        </span>

                        <span
                          className={`pill text-[0.68rem] font-semibold ${
                            isFull
                              ? "bg-red-950/40 text-red-300 border-red-500/40"
                              : "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                          }`}
                        >
                          {isFull ? "Fully Booked" : `${remaining} Seats Left`}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-white mt-4">
                        {s.routeTitle}
                      </h3>

                      <div className="mt-4 space-y-2.5 text-xs text-warm-300">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-brass shrink-0 mt-0.5" />
                          <span><strong>Pickup:</strong> {s.pickupLocation}</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock size={14} className="text-brass shrink-0 mt-0.5" />
                          <span><strong>Departure:</strong> {s.departureTime}</span>
                        </div>

                        {s.returnTime && (
                          <div className="flex items-start gap-2">
                            <Calendar size={14} className="text-brass shrink-0 mt-0.5" />
                            <span><strong>Return:</strong> {s.returnTime}</span>
                          </div>
                        )}
                      </div>

                      {s.instructions && (
                        <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-[0.72rem] text-warm-400 leading-relaxed">
                          {s.instructions}
                        </div>
                      )}
                    </div>

                    {/* Footer Contact & Reservation */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex flex-col gap-3">
                      {s.busCaptainPhone && (
                        <div className="flex items-center justify-between text-xs text-warm-300">
                          <span className="text-[0.7rem] text-warm-400">Coordinator: {s.busCaptainName}</span>
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://wa.me/${s.busCaptainPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello, I am inquiring about the ${s.routeTitle} for ${eventTitle}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[0.7rem] font-semibold"
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </a>
                            <a
                              href={`tel:${s.busCaptainPhone}`}
                              className="text-brass-light hover:text-white flex items-center gap-1 text-[0.7rem] font-semibold"
                            >
                              <Phone size={12} /> Call
                            </a>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          setSelectedShuttle(s);
                          setBookingSuccess(null);
                          setBookingError(null);
                        }}
                        className={`btn !w-full !py-2.5 !text-xs font-semibold cursor-pointer ${
                          isFull
                            ? "bg-warm-800 text-warm-500 cursor-not-allowed border-none"
                            : "btn-brass"
                        }`}
                      >
                        {isFull ? "Shuttle Full" : "Reserve Free Seat"}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: CAMP ACCOMMODATIONS */}
        {activeTab === "accommodations" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accommodations.length === 0 ? (
              <div className="col-span-full py-12 text-center text-warm-400 text-sm">
                No accommodation halls have been configured yet.
              </div>
            ) : (
              accommodations.map((a) => {
                const percent = Math.min(
                  100,
                  Math.round((a.allocatedBeds / (a.totalBeds || 1)) * 100)
                );

                return (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-white/10 bg-[#0a231b] p-6 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-brass/20 text-brass-light border-brass/40">
                          {a.category} Hall
                        </span>
                        <span className="text-xs text-warm-400">
                          {a.allocatedBeds} / {a.totalBeds} Beds
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-white mt-3">
                        {a.name}
                      </h3>

                      <p className="text-xs text-warm-300 mt-1 flex items-center gap-1.5">
                        <MapPin size={13} className="text-brass shrink-0" /> {a.location || "Campgrounds"}
                      </p>

                      {/* Capacity Meter */}
                      <div className="mt-4">
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brass transition-all duration-500 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[0.68rem] text-warm-400 mt-1">
                          <span>Occupancy</span>
                          <span>{percent}% allocated</span>
                        </div>
                      </div>

                      <div className="mt-5 p-3.5 rounded-xl bg-black/30 border border-white/5 text-xs text-warm-300 leading-relaxed">
                        <div className="text-[0.68rem] uppercase font-bold text-brass tracking-wider mb-1">
                          Porter Desk Check-In:
                        </div>
                        {a.checkInInstructions}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 text-center">
                      <p className="text-[0.7rem] text-warm-400">
                        Room allocation passes are displayed inside your <strong>Attendee Wallet</strong> after registration.
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: CAFETERIA & WELFARE */}
        {activeTab === "welfare" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-[#0a231b] p-6 shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Utensils size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-white">Daily Meal Windows</h3>
              <p className="text-xs text-warm-300 mt-1">
                Meals are served promptly at the central Dining Halls A &amp; B with digital QR scanning.
              </p>

              <div className="mt-4 space-y-2 text-xs text-warm-300">
                <div className="flex justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="font-semibold text-white">Breakfast:</span>
                  <span>7:00 AM – 8:30 AM</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="font-semibold text-white">Lunch:</span>
                  <span>1:30 PM – 3:00 PM</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                  <span className="font-semibold text-white">Dinner:</span>
                  <span>7:00 PM – 8:45 PM</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a231b] p-6 shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-brass/20 text-brass-light flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-white">Digital Meal Verification</h3>
              <p className="text-xs text-warm-300 mt-1">
                Show your <strong>Attendee Meal Pass QR code</strong> at the dining hall turnstile. No paper tickets required.
              </p>
              <div className="mt-5 p-3 rounded-xl bg-black/30 border border-white/5 text-[0.72rem] text-warm-400 leading-relaxed">
                Vegetarian, diabetic, and special medical dietary accommodations can be registered at the Welfare Desk upon arrival.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0a231b] p-6 shadow-lg">
              <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center mb-4">
                <Building size={20} />
              </div>
              <h3 className="font-display text-base font-bold text-white">Emergency &amp; Welfare Desk</h3>
              <p className="text-xs text-warm-300 mt-1">
                Medical posts and youth welfare officers are on 24/7 standby during camp sessions.
              </p>
              <div className="mt-5 space-y-2 text-xs text-warm-300">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                  <span>Camp Medical Centre:</span>
                  <span className="font-semibold text-brass-light">Gate 3 Annex</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between">
                  <span>Lost &amp; Found:</span>
                  <span className="font-semibold text-brass-light">Central Secretariat</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: SEAT RESERVATION */}
        {selectedShuttle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0a231b] border border-brass/40 p-6 text-parchment shadow-2xl relative">
              <button
                type="button"
                onClick={() => setSelectedShuttle(null)}
                className="absolute top-4 right-4 text-warm-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>

              {bookingSuccess ? (
                <div className="text-center py-4">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">Seat Reserved!</h3>
                  <p className="text-xs text-warm-300 mt-1">
                    Your shuttle boarding pass has been generated.
                  </p>

                  <div className="mt-4 p-4 rounded-xl bg-black/40 border border-brass/30 text-center">
                    <div className="text-[0.65rem] uppercase font-bold text-brass tracking-wider">
                      Boarding Code:
                    </div>
                    <div className="font-mono text-lg font-bold text-white tracking-widest mt-0.5">
                      {bookingSuccess.code}
                    </div>
                    <p className="text-[0.7rem] text-warm-400 mt-1">
                      Show this code to the Bus Captain ({selectedShuttle.busCaptainName}) at {selectedShuttle.pickupLocation}.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedShuttle(null)}
                    className="btn btn-brass !w-full !py-2.5 mt-5 text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookSeat} className="space-y-4">
                  <div>
                    <span className="text-[0.65rem] font-bold uppercase tracking-wider text-brass">
                      Free Shuttle Seat Reservation
                    </span>
                    <h3 className="font-display text-lg font-bold text-white mt-1">
                      {selectedShuttle.routeTitle}
                    </h3>
                    <p className="text-xs text-warm-300 mt-0.5">
                      Departure: {selectedShuttle.departureTime}
                    </p>
                  </div>

                  {bookingError && (
                    <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                      <AlertCircle size={15} /> {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-warm-300 mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      placeholder="e.g. Deborah Adeleke"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-brass"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-warm-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      placeholder="deborah@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-brass"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-warm-300 mb-1">
                        Phone (WhatsApp)
                      </label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                        placeholder="+234..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-brass"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-warm-300 mb-1">
                        Seats (Max 4)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={bookingForm.seatCount}
                        onChange={(e) =>
                          setBookingForm({ ...bookingForm, seatCount: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs focus:outline-none focus:border-brass"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-brass !w-full !py-3 text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : "Confirm Seat Reservation"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
