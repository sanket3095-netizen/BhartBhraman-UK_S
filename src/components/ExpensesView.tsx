/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Member, Expense, SplitType, ItineraryDay } from "../types";
import { calculateSplits } from "../utils/splitUtils";
import { Plus, Users, Calendar, Sparkles, Receipt, List, CreditCard, ChevronRight, X, HelpCircle, Check, DollarSign } from "lucide-react";
import { motion } from "motion/react";

interface ExpensesViewProps {
  expenses: Expense[];
  members: Member[];
  itinerary: ItineraryDay[];
  onAddExpense: (expense: Omit<Expense, "id">) => void;
  onDeleteExpense: (expenseId: string) => void;
}

export default function ExpensesView({
  expenses,
  members,
  itinerary,
  onAddExpense,
  onDeleteExpense
}: ExpensesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  // New Expense form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [paidBy, setPaidBy] = useState(members[0]?.id || "");
  const [isMultiplePayers, setIsMultiplePayers] = useState(false);
  const [multiplePayers, setMultiplePayers] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<Expense["category"]>("Food");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(members.map(m => m.id));
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [linkedDayId, setLinkedDayId] = useState("");
  const [billUrl, setBillUrl] = useState("");

  const categories: Expense["category"][] = [
    "Food",
    "Stay",
    "Transport",
    "Fuel",
    "Sightseeing",
    "Toll",
    "Miscellaneous"
  ];

  // Auto-init custom shares depending on splits
  useEffect(() => {
    const freshShares: Record<string, number> = {};
    members.forEach(m => {
      if (splitType === SplitType.PERCENTAGE) {
        freshShares[m.id] = selectedParticipants.includes(m.id)
          ? parseFloat((100 / selectedParticipants.length).toFixed(1))
          : 0;
      } else if (splitType === SplitType.WEIGHTED) {
        freshShares[m.id] = 1; // default relative weight unit
      } else if (splitType === SplitType.EXACT_AMOUNT) {
        freshShares[m.id] = 0;
      }
    });
    setCustomShares(freshShares);
  }, [splitType, selectedParticipants, members]);

  // Handle participant toggling
  const handleToggleParticipant = (mId: string) => {
    setSelectedParticipants(prev =>
      prev.includes(mId) ? prev.filter(id => id !== mId) : [...prev, mId]
    );
  };

  const handleSelectAll = (all: boolean) => {
    setSelectedParticipants(all ? members.map(m => m.id) : []);
  };

  const handleCustomShareChange = (mId: string, val: number) => {
    setCustomShares(prev => ({ ...prev, [mId]: val }));
  };

  const handleMultiplePayerChange = (mId: string, val: number) => {
    setMultiplePayers(prev => ({ ...prev, [mId]: val }));
  };

  // Dry run split calculation preview
  const previewSplits = () => {
    const numericAmt = typeof amount === "number" ? amount : 0;
    if (numericAmt <= 0) return {};
    return calculateSplits(numericAmt, splitType, members, selectedParticipants, customShares);
  };

  const calculatedShares = previewSplits();

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = typeof amount === "number" ? amount : 0;
    if (!title || finalAmount <= 0) return;

    // Build splits structure
    const calculated = calculateSplits(finalAmount, splitType, members, selectedParticipants, customShares);
    const participantsList = members.map(m => ({
      memberId: m.id,
      amount: calculated[m.id] || 0,
      percentage: splitType === SplitType.PERCENTAGE ? customShares[m.id] : undefined,
      weight: splitType === SplitType.WEIGHTED ? customShares[m.id] : undefined
    }));

    const finalMultiplePayers = isMultiplePayers ? multiplePayers : undefined;

    onAddExpense({
      title,
      amount: finalAmount,
      paidBy: isMultiplePayers ? Object.keys(multiplePayers)[0] || paidBy : paidBy,
      multiplePayers: finalMultiplePayers,
      date: new Date().toISOString().split("T")[0],
      category,
      location: location || "Uttarakhand",
      notes: notes || undefined,
      splitType,
      participants: participantsList,
      linkedDayId: linkedDayId || undefined,
      billUrl: billUrl || undefined
    });

    // Reset states
    setTitle("");
    setAmount("");
    setPaidBy(members[0]?.id || "");
    setIsMultiplePayers(false);
    setMultiplePayers({});
    setCategory("Food");
    setLocation("");
    setNotes("");
    setSplitType(SplitType.EQUAL);
    setSelectedParticipants(members.map(m => m.id));
    setCustomShares({});
    setLinkedDayId("");
    setBillUrl("");
    setShowAddModal(false);
  };

  // Helper file uploader base64 conversion
  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Expenses Tracker
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Total active costs spent: <span className="font-semibold text-emerald-400">₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("en-IN")}</span>
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white tracking-wide shadow-md shadow-indigo-950/20 transition-all cursor-pointer"
        >
          <Plus size={14} /> Log Cost
        </button>
      </div>

      {/* Expenses History List */}
      <div className="space-y-3.5">
        {expenses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500 text-xs">
            No expenses logged yet. Tap "Log Cost" above to start splitting.
          </div>
        ) : (
          expenses.map(exp => (
            <div
              key={exp.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800/60 bg-slate-950/20 p-4 backdrop-blur-md relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Category Badge icon helper */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 text-cyan-400 border border-slate-800/80 font-display text-sm">
                    {exp.category === "Food" && "🍽️"}
                    {exp.category === "Stay" && "🏨"}
                    {exp.category === "Transport" && "🚗"}
                    {exp.category === "Fuel" && "⚓"}
                    {exp.category === "Sightseeing" && "🏔️"}
                    {exp.category === "Toll" && "🛣️"}
                    {exp.category === "Miscellaneous" && "🛍️"}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display text-xs font-bold text-slate-100 truncate">
                      {exp.title}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 tracking-wide">
                      Paid by <span className="font-semibold text-slate-300">{members.find(m => m.id === exp.paidBy)?.name || exp.paidBy}</span> • {exp.category}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-display font-bold text-white text-xs">
                    ₹{exp.amount.toLocaleString("en-IN")}
                  </div>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="mt-1 text-[10px] text-slate-500 hover:text-red-400 font-semibold cursor-pointer block text-right"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Collateral visual indicators: linked itinerary day name / location if any */}
              <div className="mt-2.5 flex items-center justify-between border-t border-slate-900/80 pt-2 text-[10px] text-slate-500 font-mono">
                <div>
                  📍 {exp.location}
                </div>
                <div>
                  Split Type: <span className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-400">{exp.splitType.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* COMPREHENSIVE ADD EXPENSE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-900">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Receipt size={18} />
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Log Family Expense Split
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLocalSubmit} className="space-y-4">
              {/* Title & Amount */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Expense Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lokhandi Tea & Maggie stalls"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="Total cash paid"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                      setAmount(val);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Payers Segment */}
              <div className="space-y-2 pb-1 border-b border-slate-900/60">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                  <span>Who Paid?</span>
                  <button
                    type="button"
                    onClick={() => setIsMultiplePayers(!isMultiplePayers)}
                    className="text-cyan-400 font-semibold hover:underline"
                  >
                    {isMultiplePayers ? "Single Payer" : "Multiple Payers"}
                  </button>
                </div>

                {!isMultiplePayers ? (
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.avatar} {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1 rounded-xl bg-slate-900/50 p-2.5 max-h-36 overflow-y-auto">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-300">{m.avatar} {m.name} paid</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-mono">₹</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={multiplePayers[m.id] || ""}
                            onChange={(e) => handleMultiplePayerChange(m.id, parseFloat(e.target.value) || 0)}
                            className="w-20 rounded border border-slate-800 bg-slate-950 px-2 py-0.5 text-center text-xs text-white placeholder-slate-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Categories & Location & Day */}
              <div className="grid gap-3 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Linked Day</label>
                  <select
                    value={linkedDayId}
                    onChange={(e) => setLinkedDayId(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">General Expenses</option>
                    {itinerary.map(day => (
                      <option key={day.id} value={day.id}>{day.date} - {day.route}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Split Rules selection */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400 font-display">Split Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: SplitType.EQUAL, label: "Equal 👥" },
                    { id: SplitType.SELECTED_PEOPLE, label: "Custom Checklist" },
                    { id: SplitType.FAMILY_WISE, label: "Family Split" },
                    { id: SplitType.COUPLE_WISE, label: "Couple Match" },
                    { id: SplitType.PERCENTAGE, label: "Percentages %" },
                    { id: SplitType.WEIGHTED, label: "Weights ⚙️" }
                  ].map(rule => (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setSplitType(rule.id as any)}
                      className={`rounded-xl border py-2 text-center text-[10px] font-semibold transition-all ${
                        splitType === rule.id
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow shadow-cyan-950/20"
                          : "border-slate-800 bg-slate-900/30 text-slate-400"
                      }`}
                    >
                      {rule.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants Selector */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  <span>Participants Involved</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => handleSelectAll(true)} className="text-cyan-400">All</button>
                    <span>•</span>
                    <button type="button" onClick={() => handleSelectAll(false)} className="text-slate-500">None</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto rounded-xl bg-slate-950 p-2 border border-slate-900">
                  {members.map(m => {
                    const isSelected = selectedParticipants.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleParticipant(m.id)}
                        className={`flex cursor-pointer items-center justify-between p-2 rounded-lg border transition-all ${
                          isSelected
                            ? "border-slate-700 bg-slate-900 text-white"
                            : "border-slate-900 bg-slate-950 text-slate-500"
                        }`}
                      >
                        <span className="text-xs">{m.avatar} {m.name}</span>
                        {isSelected ? <Check size={12} className="text-cyan-400 animate-scale-up" /> : <div className="h-3 w-3 rounded-full border border-slate-800" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Shares Specific Inputs (Percentages, Weights, etc) */}
              {(splitType === SplitType.PERCENTAGE || splitType === SplitType.WEIGHTED) && (
                <div className="space-y-2 rounded-xl bg-slate-900/30 p-3 border border-slate-800/40">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">
                    {splitType === SplitType.PERCENTAGE ? "Custom Share percentages (%)" : "Custom Share Weights"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedParticipants.map(id => {
                      const member = members.find(m => m.id === id);
                      return member ? (
                        <div key={id} className="flex items-center justify-between bg-slate-950 p-2 rounded-lg">
                          <span className="text-slate-300">{member.name}</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={customShares[id] || ""}
                            onChange={(e) => handleCustomShareChange(id, parseFloat(e.target.value) || 0)}
                            className="w-16 rounded border border-slate-800 bg-slate-900 text-center py-0.5 text-xs text-white"
                          />
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Split calculation Live Preview result */}
              {typeof amount === "number" && amount > 0 && (
                <div className="rounded-2xl border border-indigo-950/70 bg-indigo-950/10 p-3.5 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 flex items-center gap-1">
                    <Sparkles size={11} /> SPLIT CALCULATION LIVE PREVIEW
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                    {Object.entries(calculatedShares).map(([mId, amt]) => {
                      if (amt <= 0) return null;
                      return (
                        <div key={mId} className="bg-slate-950 p-1.5 rounded text-center border border-slate-900/60">
                          <div className="text-slate-400 font-semibold truncate">
                            {members.find(m => m.id === mId)?.name || mId}
                          </div>
                          <div className="font-mono text-white mt-0.5">₹{Math.round(amt)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bill & Receipts camera simulation uploader */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Bill/Proof Wallet Upload</label>
                <div className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-4 hover:bg-slate-900/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBillUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center text-[10px] text-slate-400">
                    {billUrl ? (
                      <span className="text-cyan-400 font-semibold">✓ Bill Captured successfully</span>
                    ) : (
                      "📸 Tap to simulate Camera Snap / Upload receipt"
                    )}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3 text-center text-xs font-bold uppercase tracking-wider text-white hover:scale-[1.01] transition-transform shadow shadow-indigo-950 cursor-pointer"
              >
                Log split expense
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
