/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ItineraryDay, Expense, Hotel } from "../types";
import { Plus, Upload, Camera, CloudSun, Compass, Calendar, ArrowRight, ShieldCheck, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  itinerary: ItineraryDay[];
  expenses: Expense[];
  hotels: Hotel[];
  onNavigate: (tab: string) => void;
  onOpenQuickAdd: (type: "expense" | "document" | "memory") => void;
  totalBudget: number;
}

export default function Dashboard({
  itinerary,
  expenses,
  hotels,
  onNavigate,
  onOpenQuickAdd,
  totalBudget
}: DashboardProps) {
  // Calculations
  const completedDays = itinerary.filter(d => d.completed).length;
  const progressPct = itinerary.length > 0 ? Math.round((completedDays / itinerary.length) * 100) : 0;

  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const budgetProgress = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);

  // Find current and upcoming stays
  const currentDayIndex = itinerary.findIndex(d => d.date === "21 Jun") !== -1
    ? itinerary.findIndex(d => d.date === "21 Jun") // Mocking active trip date around June 21 for demonstration
    : 2;

  const currentDay = itinerary[currentDayIndex] || itinerary[0];
  const nextDay = itinerary[currentDayIndex + 1] || itinerary[itinerary.length - 1];

  return (
    <div className="space-y-6 pb-6">
      {/* Premium Hero Title Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-400 backdrop-blur-md">
                Live Trip Active
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Users size={12} className="text-indigo-400" /> 8 Members
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              BharatBhraman
            </h1>
            <p className="font-sans text-sm text-slate-400">
              Uttarakhand Family Travel OS • 19 – 27 Jun
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2.5 text-center">
            <Compass className="animate-spin-slow h-8 w-8 text-cyan-400" />
          </div>
        </div>

        {/* Route visualization */}
        <div className="mt-6 border-t border-slate-900/80 pt-4">
          <div className="text-xs text-slate-500 uppercase tracking-wider">Our Journey Route</div>
          <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-300">
            <div className="text-center">
              <div className="text-base">📍</div>
              <div className="font-semibold text-white">Mumbai</div>
            </div>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 mx-2 relative">
              <div className="absolute top-1/2 left-1/3 h-1.5 w-1.5 rounded-full bg-cyan-400 -translate-y-1/2" />
              <div className="absolute top-1/2 left-2/3 h-1.5 w-1.5 rounded-full bg-indigo-400 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <div className="text-base">🏔️</div>
              <div className="font-semibold text-white">Chakrata</div>
            </div>
            <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 mx-2 relative">
              <div className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-teal-400 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <div className="text-base">🕉️</div>
              <div className="font-semibold text-white">Haridwar</div>
            </div>
          </div>
          <button
            onClick={() => onNavigate("map")}
            className="mt-4 w-full rounded-xl bg-slate-900/80 py-2 text-center text-xs font-semibold text-cyan-400 border border-slate-800/80 hover:bg-slate-900 transition-all duration-200"
          >
            Preview Interactive Interactive Map
          </button>
        </div>
      </motion.div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onOpenQuickAdd("expense")}
          className="group flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/20 py-3.5 px-2 text-center backdrop-blur-md hover:bg-slate-900/40 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-all">
            <Plus size={20} />
          </div>
          <span className="mt-2 font-display text-xs font-medium text-slate-300">Add Expense</span>
        </button>

        <button
          onClick={() => onOpenQuickAdd("document")}
          className="group flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/20 py-3.5 px-2 text-center backdrop-blur-md hover:bg-slate-900/40 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-all">
            <Upload size={18} />
          </div>
          <span className="mt-2 font-display text-xs font-medium text-slate-300">Upload Ticket</span>
        </button>

        <button
          onClick={() => onOpenQuickAdd("memory")}
          className="group flex flex-col items-center justify-center rounded-2xl border border-slate-800/80 bg-slate-950/20 py-3.5 px-2 text-center backdrop-blur-md hover:bg-slate-900/40 transition-all"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-all">
            <Camera size={18} />
          </div>
          <span className="mt-2 font-display text-xs font-medium text-slate-300">Add Diary / Photo</span>
        </button>
      </div>

      {/* Metrics Row: Progress & Expenses */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Progress Card */}
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Trip Progress</span>
            <span className="text-cyan-400 font-semibold">{progressPct}%</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-white">
              {completedDays} <span className="text-sm font-normal text-slate-500">of {itinerary.length} days</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-300">
              <Calendar size={13} className="text-slate-400" /> {currentDay?.date || "N/A"}
            </span>
          </div>
          <div className="mt-3.5 h-2 w-full rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Budget vs Expense Tracker */}
        <div className="rounded-2xl border border-slate-800/70 bg-slate-950/30 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-wider">
            <span>Budget Control</span>
            <span className="text-emerald-400 font-semibold">{budgetProgress}% spent</span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold text-white">
              ₹{totalSpent.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-slate-505 block text-slate-500 mt-1">
                Estimated Limit: ₹{totalBudget.toLocaleString("en-IN")}
              </span>
            </span>
          </div>
          <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-900 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetProgress > 85 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
              }`}
              style={{ width: `${budgetProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Weather widget & Live stay alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weather box */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-800/70 bg-gradient-to-r from-slate-950/40 to-slate-950/20 p-5 backdrop-blur-md">
          <div>
            <div className="text-xs text-cyan-400 font-semibold tracking-wider uppercase mb-1">Chakrata, Uttarakhand</div>
            <div className="font-display text-3xl font-bold text-white">18°C</div>
            <p className="mt-1 font-sans text-xs text-slate-400">Cool & Misty • Min 14°C / Max 22°C</p>
          </div>
          <div className="flex flex-col items-center text-slate-400">
            <CloudSun size={38} className="text-amber-400 mb-1" />
            <span className="text-[10px] uppercase font-mono tracking-wider">Light Clouds</span>
          </div>
        </div>

        {/* Local offline notification bar */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-950/80 bg-emerald-950/20 p-4 backdrop-blur-md select-none">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-emerald-400">PWA Offline Mode Activated</div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              App stores all entries locally. Synced to memory instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Stay and Destination Info */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/15 p-5 backdrop-blur-md space-y-4">
        <h3 className="font-display text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Stay & Route Status
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Current Stay */}
          <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin size={12} className="text-cyan-400" /> Current Base Stay
            </div>
            <div className="font-display text-sm font-bold text-white">
              {currentDay?.stayName || "N/A"}
            </div>
            {currentDay?.stayId && (
              <p className="text-[11px] text-slate-400">
                Check-in: {hotels.find(h => h.id === currentDay.stayId)?.checkIn || "Active"}
              </p>
            )}
            <button
              onClick={() => onNavigate("itinerary")}
              className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1 hover:underline pt-1"
            >
              View Contacts & Booking <ArrowRight size={10} />
            </button>
          </div>

          {/* Next Journey */}
          <div className="rounded-xl border border-slate-800/40 bg-slate-950/40 p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Compass size={12} className="text-indigo-400" /> Upcoming Destination
            </div>
            <div className="font-display text-sm font-bold text-white">
              {nextDay ? nextDay.route : "Trip End"}
            </div>
            <p className="text-[11px] text-slate-400">
              Scheduled Date: {nextDay ? nextDay.date : "N/A"}
            </p>
            <button
              onClick={() => onNavigate("itinerary")}
              className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1 hover:underline pt-1"
            >
              Check Travel Suitability <ArrowRight size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
