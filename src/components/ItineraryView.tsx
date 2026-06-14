/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ItineraryDay, Member } from "../types";
import { Calendar, Phone, CheckCircle, Circle, MapPin, UserCheck, AlertTriangle, ChevronRight, ChevronDown, Plus, BookOpen, Utensils, Camera, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ItineraryViewProps {
  itinerary: ItineraryDay[];
  onToggleComplete: (dayId: string) => void;
  onAddNote: (dayId: string, note: string) => void;
  members: Member[];
}

export default function ItineraryView({
  itinerary,
  onToggleComplete,
  onAddNote,
  members
}: ItineraryViewProps) {
  const [expandedDayId, setExpandedDayId] = useState<string | null>("day-3"); // default expanded Chakrata road-trip day
  const [newNotes, setNewNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleToggleExpand = (dayId: string) => {
    setExpandedDayId(expandedDayId === dayId ? null : dayId);
  };

  const submitNote = (dayId: string) => {
    const noteText = newNotes[dayId]?.trim();
    if (!noteText) return;
    onAddNote(dayId, noteText);
    setNewNotes(prev => ({ ...prev, [dayId]: "" }));
  };

  // Filters
  const filteredItinerary = itinerary.filter(day => {
    const query = searchQuery.toLowerCase();
    return (
      day.route.toLowerCase().includes(query) ||
      day.details.toLowerCase().includes(query) ||
      day.stayName.toLowerCase().includes(query) ||
      day.date.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Title & Search bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-white">
              Day-by-Day Timeline
            </h2>
            <p className="font-sans text-xs text-slate-400">
              Uttarakhand complete mountain circuit itinerary
            </p>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-400 border border-indigo-500/20">
            {itinerary.length} Days
          </span>
        </div>

        {/* Custom Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search dates, routes, sights, stays..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pl-4 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
          <Calendar size={14} className="absolute right-3.5 top-3 text-slate-500" />
        </div>
      </div>

      {/* Timeline list */}
      <div className="space-y-4">
        {filteredItinerary.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-8 text-center text-slate-500 text-xs">
            No matching dates or sightseeing locations found.
          </div>
        ) : (
          filteredItinerary.map((day, index) => {
            const isExpanded = expandedDayId === day.id;

            return (
              <motion.div
                key={day.id}
                layout="position"
                className={`overflow-hidden rounded-2.5xl border transition-all duration-300 ${
                  isExpanded
                    ? "border-slate-700/80 bg-slate-950/45 shadow-lg shadow-black/30"
                    : "border-slate-800/60 bg-slate-950/15"
                }`}
              >
                {/* Day Header Bar */}
                <div
                  onClick={() => handleToggleExpand(day.id)}
                  className="flex cursor-pointer items-center justify-between p-4.5 select-none"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center shrink-0">
                      <div className="font-mono text-xs font-semibold text-slate-400 uppercase">JUN</div>
                      <div className="font-display text-lg font-bold text-white tracking-tighter leading-none mt-0.5">
                        {day.date.split(" ")[0]}
                      </div>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-800 mx-1" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-sm font-bold text-slate-100 truncate">
                          {day.route}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {day.details}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(day.id);
                      }}
                      className="text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {day.completed ? (
                        <CheckCircle size={18} className="text-emerald-400" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-slate-500" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Day Details Expandable area */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="border-t border-slate-900 bg-slate-950/30 px-5.5 pb-5.5 pt-4 space-y-4 text-xs"
                    >
                      {/* Stay & Contact info */}
                      <div className="flex flex-wrap gap-2 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800/40">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-cyan-400" />
                          <span className="text-slate-300 font-medium">Night Stay:</span>
                          <span className="text-white font-semibold">{day.stayName}</span>
                        </div>
                        {day.contact && (
                          <div className="flex items-center gap-1 text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800/80">
                            <Phone size={10} className="text-indigo-400" />
                            <span className="font-mono text-[10px]">{day.contact}</span>
                          </div>
                        )}
                      </div>

                      {/* Sightseeing Section */}
                      <div>
                        <div className="text-slate-400 font-display font-medium tracking-wide uppercase text-[10px] mb-2">
                          Sightseeing Sights & Stops
                        </div>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {day.sightseeing.map((sight, sIdx) => (
                            <li
                              key={sIdx}
                              className="flex items-start gap-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-900"
                            >
                              <span className="text-cyan-400 font-semibold">•</span>
                              <span className="text-slate-300">{sight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Senior Citizen Suitability Warning Card */}
                      <div
                        className={`flex gap-3 p-3.5 rounded-xl border ${
                          day.seniorCitizenSuitability.suitable
                            ? "border-emerald-950/40 bg-emerald-950/10 text-slate-300"
                            : "border-amber-950/40 bg-amber-950/10 text-slate-300"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {day.seniorCitizenSuitability.suitable ? (
                            <UserCheck className="text-emerald-400" size={16} />
                          ) : (
                            <AlertTriangle className="text-amber-400" size={16} />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-[11px] mb-0.5 uppercase tracking-wider">
                            {day.seniorCitizenSuitability.suitable
                              ? "Senior Friendly (Suitable)"
                              : "Senior Advisory (Take Care)"}
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-400">
                            {day.seniorCitizenSuitability.reason}
                          </p>
                        </div>
                      </div>

                      {/* Professional Food / Photography Guides */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {day.foodSuggestions && day.foodSuggestions.length > 0 && (
                          <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-2 uppercase tracking-wide">
                              <Utensils size={12} className="text-orange-400" /> Food & Dining Tips
                            </div>
                            <ul className="space-y-1.5 text-slate-400 text-[11px]">
                              {day.foodSuggestions.map((food, fIdx) => (
                                <li key={fIdx}>• {food}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {day.photoSpots && day.photoSpots.length > 0 && (
                          <div className="p-3 bg-slate-900/30 rounded-xl border border-slate-800/40">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mb-2 uppercase tracking-wide">
                              <Camera size={12} className="text-yellow-400" /> Photography Locations
                            </div>
                            <ul className="space-y-1.5 text-slate-400 text-[11px]">
                              {day.photoSpots.map((spot, pIdx) => (
                                <li key={pIdx}>📸 {spot}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Shared Family Notes / Dairy Log */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-display font-semibold uppercase tracking-wider">
                          <BookOpen size={11} className="text-indigo-400" /> Family Diary Notes
                        </div>
                        
                        {day.notes.length > 0 && (
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {day.notes.map((note, nIdx) => (
                              <div
                                key={nIdx}
                                className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-900 text-slate-300 leading-relaxed"
                              >
                                {note}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Note Entry Form */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add instant note or logistics alert..."
                            value={newNotes[day.id] || ""}
                            onChange={(e) =>
                              setNewNotes(prev => ({ ...prev, [day.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitNote(day.id);
                            }}
                            className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            onClick={() => submitNote(day.id)}
                            className="rounded-lg bg-indigo-500/10 px-3 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition-all leading-none py-1.5 shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
