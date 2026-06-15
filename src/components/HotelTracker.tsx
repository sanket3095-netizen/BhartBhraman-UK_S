/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Hotel } from "../types";
import { 
  Building2, Plus, Trash2, Edit2, Calendar, 
  IndianRupee, Pin, Phone, Info, X
} from "lucide-react";
import { useSync } from "../context/SyncContext";

interface HotelTrackerProps {
  onRefreshExpenses?: () => void;
}

export default function HotelTracker({ onRefreshExpenses }: HotelTrackerProps) {
  const { hotels, saveHotel, deleteHotel } = useSync();

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Field states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [roomAllocation, setRoomAllocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [bookingStatus, setBookingStatus] = useState("Confirmed");
  const [bookingAmount, setBookingAmount] = useState<number | "">("");
  const [advancePaid, setAdvancePaid] = useState<number | "">("");
  const [pendingAmount, setPendingAmount] = useState<number | "">("");

  const openAddForm = () => {
    setEditingId(null);
    setName("");
    setLocation("");
    setContact("");
    setRoomAllocation("");
    setCheckIn("");
    setCheckOut("");
    setBookingStatus("Confirmed");
    setBookingAmount("");
    setAdvancePaid("");
    setPendingAmount("");
    setIsFormOpen(true);
  };

  const openEditForm = (hotel: Hotel) => {
    setEditingId(hotel.id);
    setName(hotel.name);
    setLocation(hotel.location);
    setContact(hotel.contact || "");
    setRoomAllocation(hotel.roomAllocation || "");
    setCheckIn(hotel.checkIn);
    setCheckOut(hotel.checkOut);
    setBookingStatus(hotel.bookingStatus || "Confirmed");
    setBookingAmount(hotel.bookingAmount ?? "");
    setAdvancePaid(hotel.advancePaid ?? "");
    setPendingAmount(hotel.pendingAmount ?? "");
    setIsFormOpen(true);
  };

  // Keep cost balances aligned
  const handleAmountChange = (valStr: string, fieldType: "total" | "advance") => {
    const num = valStr === "" ? "" : Number(valStr);
    
    if (fieldType === "total") {
      setBookingAmount(num);
      const adv = advancePaid === "" ? 0 : Number(advancePaid);
      if (num !== "") {
        setPendingAmount(Math.max(0, num - adv));
      }
    } else {
      setAdvancePaid(num);
      const tot = bookingAmount === "" ? 0 : Number(bookingAmount);
      if (bookingAmount !== "") {
        setPendingAmount(Math.max(0, tot - (num === "" ? 0 : num)));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !checkIn || !checkOut) {
      return;
    }

    const bAmt = bookingAmount === "" ? 0 : Number(bookingAmount);
    const aPaid = advancePaid === "" ? 0 : Number(advancePaid);
    const pAmt = pendingAmount === "" ? Math.max(0, bAmt - aPaid) : Number(pendingAmount);

    const hotelId = editingId || `hotel-${Date.now()}`;
    const payload: Hotel = {
      id: hotelId,
      name,
      location,
      contact: contact || undefined,
      roomAllocation,
      checkIn,
      checkOut,
      bookingStatus,
      bookingAmount: bAmt,
      advancePaid: aPaid,
      pendingAmount: pAmt
    };

    await saveHotel(payload);
    setIsFormOpen(false);
    if (onRefreshExpenses) onRefreshExpenses();
  };

  const handleDelete = async (id: string, hotelName: string) => {
    if (!window.confirm(`Are you sure you want to remove the booking for ${hotelName}?`)) {
      return;
    }
    await deleteHotel(id);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Building2 className="text-orange-500 h-6 w-6" /> Hotel Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time synced group lodgings & payments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openAddForm}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-950/20 hover:scale-[1.02] active:scale-95 transition"
          >
            <Plus size={16} /> Add Hotel
          </button>
        </div>
      </div>

      {/* Main Table view */}
      {hotels.length === 0 ? (
        <div className="rounded-3xl border border-slate-850 bg-slate-900/10 p-8 text-center text-slate-400 space-y-4">
          <Building2 size={40} className="mx-auto text-slate-700" />
          <div>
            <h4 className="text-base font-bold text-slate-300 uppercase tracking-wide">No Hotels Recorded Only</h4>
            <p className="text-sm text-slate-500 mt-1">
              Add your Dehradun, Chakrata, Hanol, or Mussoorie accommodations here to sync details with friends!
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="mx-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold uppercase text-xs tracking-wider hover:bg-orange-500/20 transition"
          >
            Create First Booking
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Card list representing responsive structured table */}
          {hotels.map((hotel) => (
            <div 
              key={hotel.id}
              className="relative overflow-hidden rounded-2xl border border-slate-850 bg-slate-900/20 p-5 space-y-4 shadow hover:border-slate-800 transition"
            >
              {/* Hotel booking status tag & Quick Actions */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    hotel.bookingStatus === "Confirmed" 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {hotel.bookingStatus === "Confirmed" ? "✓ Confirmed" : "⚠ Pending"}
                  </span>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-1.5 flex items-center gap-2">
                    {hotel.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(hotel)}
                    className="p-2 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition"
                    title="Edit booking"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(hotel.id, hotel.name)}
                    className="p-2 rounded-lg hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition"
                    title="Delete booking"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Data Detail Block */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-900/60 pt-3">
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-mono">Location</span>
                  <p className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                    <Pin size={12} className="text-orange-400 shrink-0" /> {hotel.location}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-505 text-slate-500 font-mono">Contact Info</span>
                  <p className="text-slate-300 font-medium flex items-center gap-1.5 truncate">
                    <Phone size={11} className="text-amber-400 shrink-0" /> {hotel.contact || "To be confirmed"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-505 text-slate-500 font-mono">Check-In Date</span>
                  <p className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} className="text-orange-400 shrink-0" /> {hotel.checkIn}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider text-slate-505 text-slate-500 font-mono">Check-Out Date</span>
                  <p className="text-slate-205 text-slate-200 font-semibold flex items-center gap-1.5">
                    <Calendar size={12} className="text-amber-400 shrink-0" /> {hotel.checkOut}
                  </p>
                </div>
              </div>

              {/* Room allocation detail banner */}
              {hotel.roomAllocation && (
                <div className="rounded-xl bg-slate-950/40 p-3 border border-slate-900/50 flex gap-2">
                  <Info size={14} className="text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    <strong>Room Allocation:</strong> {hotel.roomAllocation}
                  </p>
                </div>
              )}

              {/* Spend status balance */}
              <div className="flex items-center justify-between text-xs bg-slate-950/20 p-3 rounded-xl border border-slate-900">
                <div className="text-center flex-1">
                  <span className="block text-slate-500 font-mono text-[10px] uppercase">Total cost</span>
                  <span className="text-sm font-black text-white flex items-center justify-center gap-0.5 mt-0.5">
                    <IndianRupee size={11} /> {(hotel.bookingAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-slate-900" />
                <div className="text-center flex-1">
                  <span className="block text-slate-505 text-slate-500 font-mono text-[10px] uppercase">Advance paid</span>
                  <span className="text-sm font-bold text-green-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <IndianRupee size={11} /> {(hotel.advancePaid || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-slate-900" />
                <div className="text-center flex-1">
                  <span className="block text-slate-505 text-slate-500 font-mono text-[10px] uppercase">Due Balance</span>
                  <span className="text-sm font-bold text-orange-400 flex items-center justify-center gap-0.5 mt-0.5">
                    <IndianRupee size={11} /> {(hotel.pendingAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Aggregate Stats Footer */}
          <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-5 flex items-center justify-between shadow-inner">
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Group Hotels Summary:</span>
            <div className="text-right">
              <div className="text-lg font-black text-white flex items-center justify-end gap-0.5">
                <IndianRupee size={14} className="text-orange-400" />
                {hotels.reduce((acc, h) => acc + (h.bookingAmount || 0), 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-slate-500 uppercase tracking-widest block font-mono mt-0.5">
                Total Accomodation Spend
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded-[2.5rem] p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-orange-400" />
                {editingId ? "Modify Booking Info" : "Add Hotel Booking"}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-full text-slate-500 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hotel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Hosteller Chakrata"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chakrata, Uttarakhand"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check-in Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 21 Jun 2024"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check-out Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 23 Jun 2024"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 9411171523"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booking Status</label>
                  <select
                    value={bookingStatus}
                    onChange={(e) => setBookingStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Allocation Details</label>
                <textarea
                  placeholder="Allocate family members to specific rooms..."
                  value={roomAllocation}
                  onChange={(e) => setRoomAllocation(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Costs inputs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-900/20 p-2.5 rounded-2xl border border-slate-850">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Booking Cost (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={bookingAmount}
                    onChange={(e) => handleAmountChange(e.target.value, "total")}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advance Paid (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={advancePaid}
                    onChange={(e) => handleAmountChange(e.target.value, "advance")}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-white placeholder-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Due Pending Balance (₹)</label>
                  <input
                    type="number"
                    disabled
                    placeholder="0"
                    value={pendingAmount}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-400 placeholder-slate-705 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-center text-xs font-bold uppercase tracking-wider text-white hover:scale-[1.01] active:scale-95 transition-all shadow shadow-orange-950/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editingId ? "Save Modifications" : "Save Hotel Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
