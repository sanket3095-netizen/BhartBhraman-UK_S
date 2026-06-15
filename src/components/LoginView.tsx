/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useSync } from "../context/SyncContext";
import { INITIAL_MEMBERS } from "../data/initialData";
import { Compass, KeyRound, User, ChevronRight, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";

export default function LoginView() {
  const { attemptLogin, loginError, isInitializing, isPasscodeVerified } = useSync();
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [passcode, setPasscode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    
    setLoading(true);
    const success = await attemptLogin(selectedMemberId, passcode);
    setLoading(false);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-6">
        <Compass className="h-10 w-10 text-orange-500 animate-spin-slow mb-4" />
        <span className="text-xs font-mono text-slate-500 animate-pulse uppercase tracking-widest">
          Initializing secure trip feed...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-center items-center p-5 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-cyan-500 text-white shadow-lg mb-2">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <h1 className="font-display text-xl font-black tracking-widest text-white uppercase">
            BHARATBHRAMAN
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Uttarakhand 2026 Private Family Group
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Member select */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">
              Select Your Profile
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <User size={16} />
              </span>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-medium text-slate-200 focus:border-cyan-500/50 focus:outline-none transition appearance-none cursor-pointer"
              >
                <option value="" disabled>Choose who you are...</option>
                {INITIAL_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-950 py-2">
                    {m.avatar} {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Passcode Input */}
          {!isPasscodeVerified ? (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">
                Family Trip Passcode
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  required
                  placeholder="Enter passcode from Sanket..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none transition font-mono tracking-widest"
                />
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/25 border border-emerald-500/25 rounded-2xl p-3 flex items-center gap-2.5">
              <span className="text-emerald-500 text-sm">🛡️</span>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Device Authorized</p>
                <p className="text-[9px] text-slate-300 leading-none mt-0.5">Your family passcode has been pre-verified.</p>
              </div>
            </div>
          )}

          {/* Error display */}
          {loginError && (
            <div className="flex items-start gap-2.5 bg-red-950/30 border border-red-500/20 rounded-xl p-3 text-[11px] text-red-400 leading-relaxed font-medium">
              <ShieldAlert size={14} className="shrink-0 mt-0.5 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !selectedMemberId || (!isPasscodeVerified && !passcode)}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-orange-500 to-cyan-500 hover:opacity-95 text-white font-bold text-xs py-3 rounded-2xl transition shadow-lg shadow-orange-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Verifying private key...</span>
            ) : (
              <>
                <span>Enter Personal Dashboard</span>
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-600 leading-relaxed font-medium">
            This workspace uses secure real-time syncing.<br />Only authorized family members are grand-allowed access.
          </p>
        </div>

      </div>
    </div>
  );
}
