"use client";

import React, { useState } from "react";
import {
  Bus,
  BedDouble,
  Utensils,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Users,
  Search,
  Loader2,
  ShieldCheck,
  Building,
  QrCode,
} from "lucide-react";

interface Accommodation {
  id: string;
  name: string;
  category: string;
  location: string;
  totalBeds: number;
  allocatedBeds: number;
  checkInInstructions: string;
  isActive: boolean;
}

interface Shuttle {
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
  isActive: boolean;
}

interface Props {
  eventId: string;
  eventTitle: string;
  initialAccommodations: Accommodation[];
  initialShuttles: Shuttle[];
}

export function DashboardLogisticsManager({
  eventId,
  eventTitle,
  initialAccommodations,
  initialShuttles,
}: Props) {
  const [activeTab, setActiveTab] = useState<"hostels" | "shuttles" | "meals">("hostels");
  const [accommodations, setAccommodations] = useState<Accommodation[]>(initialAccommodations);
  const [shuttles, setShuttles] = useState<Shuttle[]>(initialShuttles);

  // New Accommodation Modal
  const [showAccModal, setShowAccModal] = useState(false);
  const [accForm, setAccForm] = useState({
    name: "",
    category: "general",
    location: "",
    totalBeds: 50,
    checkInInstructions: "Present your digital camp pass at the Accommodation Secretariat.",
  });
  const [savingAcc, setSavingAcc] = useState(false);

  // New Shuttle Modal
  const [showShuttleModal, setShowShuttleModal] = useState(false);
  const [shuttleForm, setShuttleForm] = useState({
    routeTitle: "",
    pickupLocation: "",
    departureTime: "",
    returnTime: "",
    busCaptainName: "Transport Coordinator",
    busCaptainPhone: "",
    totalSeats: 50,
    fare: 0,
    instructions: "Please arrive 15 minutes before departure time.",
  });
  const [savingShuttle, setSavingShuttle] = useState(false);

  // Dining Hall Meal Scanner
  const [mealVoucherInput, setMealVoucherInput] = useState("");
  const [mealVerifying, setMealVerifying] = useState(false);
  const [mealMessage, setMealMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleCreateAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAcc(true);

    try {
      const res = await fetch(`/api/events/${eventId}/logistics/accommodations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accForm),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to create");

      setAccommodations((prev) => [...prev, data.accommodation]);
      setShowAccModal(false);
      setAccForm({
        name: "",
        category: "general",
        location: "",
        totalBeds: 50,
        checkInInstructions: "Present your digital camp pass at the Accommodation Secretariat.",
      });
    } catch (err: any) {
      alert(err.message || "Failed to save accommodation");
    } finally {
      setSavingAcc(false);
    }
  };

  const handleCreateShuttle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShuttle(true);

    try {
      const res = await fetch(`/api/events/${eventId}/logistics/shuttles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shuttleForm),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to create");

      setShuttles((prev) => [...prev, data.shuttle]);
      setShowShuttleModal(false);
      setShuttleForm({
        routeTitle: "",
        pickupLocation: "",
        departureTime: "",
        returnTime: "",
        busCaptainName: "Transport Coordinator",
        busCaptainPhone: "",
        totalSeats: 50,
        fare: 0,
        instructions: "Please arrive 15 minutes before departure time.",
      });
    } catch (err: any) {
      alert(err.message || "Failed to save shuttle");
    } finally {
      setSavingShuttle(false);
    }
  };

  const handleVerifyMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealVoucherInput.trim()) return;

    setMealVerifying(true);
    setMealMessage(null);

    try {
      const res = await fetch(`/api/events/${eventId}/logistics/meals/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherCode: mealVoucherInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMealMessage({ type: "error", text: data.error || "Verification failed" });
        return;
      }

      setMealMessage({ type: "success", text: data.message });
      setMealVoucherInput("");
    } catch {
      setMealMessage({ type: "error", text: "Network error verifying meal voucher." });
    } finally {
      setMealVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("hostels")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "hostels"
                ? "bg-ink text-parchment shadow-md"
                : "bg-paper text-warm-600 hover:text-ink"
            }`}
          >
            <BedDouble size={15} /> Camp Hostels &amp; Halls ({accommodations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("shuttles")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "shuttles"
                ? "bg-ink text-parchment shadow-md"
                : "bg-paper text-warm-600 hover:text-ink"
            }`}
          >
            <Bus size={15} /> Bus Shuttles ({shuttles.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("meals")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "meals"
                ? "bg-ink text-parchment shadow-md"
                : "bg-paper text-warm-600 hover:text-ink"
            }`}
          >
            <Utensils size={15} /> Dining Hall Scanner
          </button>
        </div>

        {activeTab === "hostels" && (
          <button
            type="button"
            onClick={() => setShowAccModal(true)}
            className="btn btn-brass !py-2.5 !px-4 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} /> Add Hostel Block
          </button>
        )}

        {activeTab === "shuttles" && (
          <button
            type="button"
            onClick={() => setShowShuttleModal(true)}
            className="btn btn-brass !py-2.5 !px-4 text-xs font-semibold cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus size={15} /> Add Shuttle Route
          </button>
        )}
      </div>

      {/* TAB 1: CAMP HOSTELS */}
      {activeTab === "hostels" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accommodations.map((a) => {
              const occupancy = Math.min(100, Math.round((a.allocatedBeds / (a.totalBeds || 1)) * 100));
              return (
                <div key={a.id} className="card p-6 border border-black/10 bg-paper flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-brass/15 text-brass-deep">
                        {a.category} Hall
                      </span>
                      <span className="text-xs text-warm-500 font-semibold">
                        {a.allocatedBeds} / {a.totalBeds} Beds
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink mt-3">
                      {a.name}
                    </h3>
                    <p className="text-xs text-warm-500 mt-1 flex items-center gap-1">
                      <MapPin size={13} className="text-brass shrink-0" /> {a.location || "Campgrounds"}
                    </p>

                    <div className="mt-4">
                      <div className="h-2 w-full bg-warm-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brass transition-all duration-300 rounded-full"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[0.68rem] text-warm-400 mt-1">
                        <span>{a.totalBeds - a.allocatedBeds} beds remaining</span>
                        <span>{occupancy}% allocated</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-warm-50 border border-black/5 text-xs text-warm-600">
                      <strong>Check-In Instructions:</strong> {a.checkInInstructions}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BUS SHUTTLES */}
      {activeTab === "shuttles" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shuttles.map((s) => {
              const remaining = Math.max(0, s.totalSeats - s.bookedSeats);
              const isFull = s.totalSeats > 0 && remaining === 0;

              return (
                <div key={s.id} className="card p-6 border border-black/10 bg-paper flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="pill text-[0.65rem] font-bold uppercase tracking-wider bg-sky-100 text-sky-800">
                        {s.fare === 0 ? "Free Church Shuttle" : `₦${s.fare.toLocaleString()}`}
                      </span>
                      <span
                        className={`pill text-[0.68rem] font-semibold ${
                          isFull ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isFull ? "Full" : `${remaining} Seats Left`}
                      </span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-ink mt-3">
                      {s.routeTitle}
                    </h3>

                    <div className="mt-3 space-y-1.5 text-xs text-warm-600">
                      <div><strong>Pickup:</strong> {s.pickupLocation}</div>
                      <div><strong>Departure:</strong> {s.departureTime}</div>
                      {s.returnTime && <div><strong>Return:</strong> {s.returnTime}</div>}
                      {s.busCaptainPhone && (
                        <div className="pt-2 text-ink font-semibold">
                          Captain: {s.busCaptainName} ({s.busCaptainPhone})
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-black/10 flex items-center justify-between text-xs text-warm-500">
                    <span>Booked: <strong>{s.bookedSeats}</strong> / {s.totalSeats}</span>
                    <span className="text-emerald-700 font-semibold">Active Route</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DINING HALL MEAL SCANNER */}
      {activeTab === "meals" && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="rounded-2xl border border-brass/40 bg-cypress text-parchment p-8 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brass-light">
              <Utensils size={16} /> Cafeteria &amp; Welfare Desk
            </div>
            <h3 className="font-display text-2xl font-bold mt-1 text-white">
              Verify Attendee Meal Pass
            </h3>
            <p className="text-xs text-warm-300 mt-1 leading-relaxed">
              Enter the attendee&apos;s meal voucher code (e.g. <code>MEAL-BRK-9901</code>) or scan the barcode from their digital pass to verify entry into the dining hall.
            </p>

            <form onSubmit={handleVerifyMeal} className="mt-6 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={mealVoucherInput}
                onChange={(e) => setMealVoucherInput(e.target.value.toUpperCase())}
                placeholder="e.g. MEAL-LUN-1234"
                className="font-mono text-sm uppercase px-4 py-3.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder:text-warm-500 focus:outline-none focus:border-brass flex-1"
              />
              <button
                type="submit"
                disabled={mealVerifying || !mealVoucherInput.trim()}
                className="btn btn-brass !py-3.5 !px-6 text-sm font-semibold cursor-pointer shrink-0"
              >
                {mealVerifying ? <Loader2 size={16} className="animate-spin" /> : "Verify & Mark Served"}
              </button>
            </form>

            {mealMessage && (
              <div
                className={`mt-4 p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                  mealMessage.type === "success"
                    ? "bg-emerald-950/80 text-emerald-200 border border-emerald-500/40"
                    : "bg-red-950/80 text-red-200 border border-red-500/40"
                }`}
              >
                {mealMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span className="font-medium">{mealMessage.text}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD ACCOMMODATION */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-paper border border-black/10 p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-ink">Add Hostel / Camp Block</h3>
            <form onSubmit={handleCreateAccommodation} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Hostel / Hall Name</label>
                <input
                  type="text"
                  required
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  placeholder="e.g. Esther Hall (Female Youths)"
                  className="input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Category</label>
                  <select
                    value={accForm.category}
                    onChange={(e) => setAccForm({ ...accForm, category: e.target.value })}
                    className="input w-full text-xs"
                  >
                    <option value="general">General Dormitory</option>
                    <option value="male">Male Youths</option>
                    <option value="female">Female Youths</option>
                    <option value="ministers">Pastors &amp; Ministers</option>
                    <option value="couples">Couples / Families</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={accForm.totalBeds}
                    onChange={(e) => setAccForm({ ...accForm, totalBeds: Number(e.target.value) })}
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Campus Location</label>
                <input
                  type="text"
                  value={accForm.location}
                  onChange={(e) => setAccForm({ ...accForm, location: e.target.value })}
                  placeholder="e.g. Zone 4, Near Sports Complex"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Porter Desk Check-In Instructions</label>
                <textarea
                  rows={3}
                  value={accForm.checkInInstructions}
                  onChange={(e) => setAccForm({ ...accForm, checkInInstructions: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAccModal(false)}
                  className="btn btn-secondary !text-xs !py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAcc}
                  className="btn btn-brass !text-xs !py-2"
                >
                  {savingAcc ? "Saving..." : "Save Hostel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHUTTLE */}
      {showShuttleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-paper border border-black/10 p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-ink">Add Bus Shuttle Route</h3>
            <form onSubmit={handleCreateShuttle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Route Title</label>
                <input
                  type="text"
                  required
                  value={shuttleForm.routeTitle}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, routeTitle: e.target.value })}
                  placeholder="e.g. Berger Bus Stop ⇄ Camp Auditorium"
                  className="input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-warm-700 mb-1">Pickup Location &amp; Landmark</label>
                <input
                  type="text"
                  required
                  value={shuttleForm.pickupLocation}
                  onChange={(e) => setShuttleForm({ ...shuttleForm, pickupLocation: e.target.value })}
                  placeholder="e.g. Under the Pedestrian Bridge, Berger, Lagos"
                  className="input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Departure Schedule</label>
                  <input
                    type="text"
                    required
                    value={shuttleForm.departureTime}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, departureTime: e.target.value })}
                    placeholder="e.g. Friday 2:00 PM & 5:00 PM"
                    className="input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Return Schedule</label>
                  <input
                    type="text"
                    value={shuttleForm.returnTime}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, returnTime: e.target.value })}
                    placeholder="e.g. Sunday Post-Vigil 6:00 AM"
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Bus Captain / Driver Name</label>
                  <input
                    type="text"
                    value={shuttleForm.busCaptainName}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, busCaptainName: e.target.value })}
                    placeholder="e.g. Bro. Samuel Adeleke"
                    className="input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Captain Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={shuttleForm.busCaptainPhone}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, busCaptainPhone: e.target.value })}
                    placeholder="+234..."
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Total Bus Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={shuttleForm.totalSeats}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, totalSeats: Number(e.target.value) })}
                    className="input w-full text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-warm-700 mb-1">Fare (0 for Free Shuttle)</label>
                  <input
                    type="number"
                    min="0"
                    value={shuttleForm.fare}
                    onChange={(e) => setShuttleForm({ ...shuttleForm, fare: Number(e.target.value) })}
                    className="input w-full text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-black/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShuttleModal(false)}
                  className="btn btn-secondary !text-xs !py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingShuttle}
                  className="btn btn-brass !text-xs !py-2"
                >
                  {savingShuttle ? "Saving..." : "Save Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
