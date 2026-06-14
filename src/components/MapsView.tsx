/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Compass, MapPin, Eye, Info, Calendar, Phone, Landmark, Navigation2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MapPinPoint {
  name: string;
  lat: number;
  lng: number;
  altitude: string;
  type: "city" | "sight" | "stay";
  description: string;
  coordString: string;
  contact?: string;
  sights?: string[];
  stayName?: string;
}

const PIN_POINTS: MapPinPoint[] = [
  { name: "Mumbai", lat: 10, lng: 20, coordString: "19.0760 N, 72.8777 E", altitude: "14 m", type: "city", description: "Trip Starting point. Gathers at Terminal.", sights: ["Chhatrapati Shivaji Maharaj Terminus", "Railway departures"] },
  { name: "Delhi", lat: 30, lng: 45, coordString: "28.6139 N, 77.2090 E", altitude: "213 m", type: "city", description: "Vande Bharat Express launch station.", sights: ["Anand Vihar Junction", "Connaught Place", "India Gate"] },
  { name: "Dehradun", lat: 50, lng: 55, coordString: "30.3165 N, 78.0322 E", altitude: "430 m", type: "city", description: "Collect Gocars self-drives. Kamini Homestay.", stayName: "Kamini Homestay", sights: ["Local markets", "Robber's Cave"] },
  { name: "Kalsi", lat: 58, lng: 52, coordString: "30.5284 N, 77.8486 E", altitude: "650 m", type: "sight", description: "Visit historic 3rd-century BC Emperor Ashoka Rock Edicts.", sights: ["Emperor Ashoka Rock Edicts"] },
  { name: "Tiger Falls", lat: 68, lng: 51, coordString: "30.7302 N, 77.8687 E", altitude: "1,400 m", type: "sight", description: "Roaring 312 ft gorgeous waterfall, needs steep 1km trail climb.", sights: ["Waterfall views", "Hill-stalls"] },
  { name: "Chakrata", lat: 66, lng: 55, coordString: "30.7016 N, 77.8687 E", altitude: "2,118 m", type: "stay", description: "Gorgeous isolated mountain cantonment. Staying at The Hosteller.", contact: "09358214531", sights: ["Chilmiri Neck (Sunset point)", "Ramtal Horticulture Garden"] },
  { name: "Lokhandi", lat: 74, lng: 50, coordString: "30.8329 N, 77.8546 E", altitude: "2,410 m", type: "sight", description: "Scenic high meadow stop lining high snow-wrapped peaks.", sights: ["High snow peaks viewing"] },
  { name: "Hanol", lat: 86, lng: 48, coordString: "30.9575 N, 77.8920 E", altitude: "1,420 m", type: "stay", description: "Riverside village. Celebrated 9th-cent Mahasu Devta temple.", contact: "9411171523", sights: ["Mahasu Devta Temple", "Tons River walk"] },
  { name: "Lakha Mandal", lat: 72, lng: 64, coordString: "30.7259 N, 78.0623 E", altitude: "1,372 m", type: "sight", description: "Legendary Mahabharata associated temple shell containing ancient stone Shivlings.", sights: ["Ancient Stone Lingams"] },
  { name: "Mussoorie", lat: 60, lng: 69, coordString: "30.4597 N, 78.0772 E", altitude: "2,005 m", type: "stay", description: "Classic Queen of Hills. Stay at Zostel Mussoorie on Mall Road.", sights: ["Mall Road walk", "Kempty Falls"] },
  { name: "Haridwar", lat: 44, lng: 74, coordString: "29.9457 N, 78.1642 E", altitude: "314 m", type: "city", description: "Holy city. Spiritual Ganga Aarti performance at Har Ki Pauri ghats.", sights: ["Har Ki Pauri Ghats (Ganga Aarti)", "Moti Bazar shopping"] }
];

export default function MapsView() {
  const [selectedPin, setSelectedPin] = useState<MapPinPoint | null>(PIN_POINTS[5]); // default to Chakrata info

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            BharatBhraman Route Map
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Interactive geographic road-trip planner
          </p>
        </div>
        <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] text-cyan-400 font-mono uppercase tracking-wider">
          <Navigation2 size={11} className="rotate-45" /> Map Operational
        </div>
      </div>

      {/* Dynamic Vector Canvas Map */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 aspect-[4/3] flex items-center justify-center">
        {/* Abstract topographic contour background lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/30 via-slate-900/40 to-black pointer-events-none" />

        {/* Custom SVG Route Lines for seamless visual tracking */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Mumbai -> Delhi -> Dehradun -> Chakrata -> Hanol */}
          <motion.path
            d="M 20 10 L 45 30 L 55 50 L 52 58 L 55 66 L 51 68 L 50 74 L 48 86"
            fill="none"
            stroke="rgba(34, 211, 238, 0.35)"
            strokeWidth="0.8"
            strokeDasharray="2, 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {/* Hanol -> Lakha Mandal -> Mussoorie -> Haridwar */}
          <motion.path
            d="M 48 86 L 64 72 L 69 60 L 74 44"
            fill="none"
            stroke="rgba(99, 102, 241, 0.35)"
            strokeWidth="0.8"
            strokeDasharray="2, 2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />

          {/* Continuous Solid Glow Line of actively navigated route segments */}
          <path
            d="M 20 10 L 45 30 L 55 50 L 52 58 L 55 66"
            fill="none"
            stroke="rgba(34, 211, 238, 0.7)"
            strokeWidth="0.5"
          />
        </svg>

        {/* Grid labels */}
        <div className="absolute top-2 left-3 font-mono text-[8px] text-slate-600">ZONE: GARHWAL HIMALAYAS UT-1</div>
        <div className="absolute bottom-2 right-3 font-mono text-[8px] text-slate-600">UTTARAKHAND OS v1.0 • OFFLINE APPROVED</div>

        {/* Interactive Glowing Pins overlay */}
        {PIN_POINTS.map((pin) => {
          const isSelected = selectedPin?.name === pin.name;

          return (
            <button
              key={pin.name}
              onClick={() => setSelectedPin(pin)}
              className="absolute group z-10 focus:outline-none focus:scale-110 transition-transform cursor-pointer"
              style={{ top: `${100 - pin.lat}%`, left: `${pin.lng}%` }}
            >
              {/* Outer pulsing beacon */}
              <div
                className={`absolute -top-1.5 -left-1.5 h-6 w-6 rounded-full marker-pulse pointer-events-none transition-all ${
                  isSelected
                    ? "bg-cyan-500/25"
                    : "bg-indigo-500/10 group-hover:bg-indigo-505/20"
                }`}
              />

              {/* Pin Core */}
              <div
                className={`h-3 w-3 rounded-full border shadow transition-all ${
                  isSelected
                    ? "bg-cyan-400 border-white scale-125 shadow-cyan-400/50"
                    : pin.type === "stay"
                    ? "bg-teal-500 border-slate-900 shadow-teal-500/30"
                    : pin.type === "city"
                    ? "bg-indigo-400 border-slate-900 shadow-indigo-400/30"
                    : "bg-amber-400 border-slate-900"
                }`}
              />

              {/* Tag name display */}
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-slate-400 whitespace-nowrap bg-slate-950/80 border border-slate-900/60 rounded px-1 group-hover:text-white transition-colors">
                {pin.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Node Drawer */}
      <AnimatePresence mode="wait">
        {selectedPin && (
          <motion.div
            key={selectedPin.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="rounded-2.5xl border border-slate-800 bg-slate-950/45 p-5 backdrop-blur-md space-y-4 shadow-xl"
          >
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div>
                <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] text-indigo-400 font-mono uppercase tracking-wider">
                  {selectedPin.type === "stay" ? "🏠 Base Camp Stay" : selectedPin.type === "city" ? "🛤️ Transit Core" : "🏔️ Point of Interest"}
                </span>
                <h3 className="mt-1 font-display text-base font-bold text-white">
                  {selectedPin.name}
                </h3>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs text-slate-400 block tracking-tighter">
                  🏔️ Altitude: <span className="font-semibold text-slate-200">{selectedPin.altitude}</span>
                </span>
                <span className="font-mono text-[9px] text-slate-500 block mt-0.5">
                  {selectedPin.coordString}
                </span>
              </div>
            </div>

            {/* Description text */}
            <p className="text-slate-300 text-xs leading-relaxed">
              {selectedPin.description}
            </p>

            {/* Contacts & Stays info if any */}
            {selectedPin.contact && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-900/50 p-2.5 border border-slate-800/40 text-xs text-slate-300">
                <Phone size={13} className="text-cyan-400" />
                <span className="font-semibold">Local Contact Phone:</span>
                <span className="font-mono text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{selectedPin.contact}</span>
              </div>
            )}

            {/* Sightseeings list inside panel */}
            {selectedPin.sights && selectedPin.sights.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                  <Landmark size={11} className="text-cyan-400" /> Recommended Stops & Sights in area
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPin.sights.map((sight, sIdx) => (
                    <span
                      key={sIdx}
                      className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-medium px-2.5 py-1 rounded-lg"
                    >
                      {sight}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
