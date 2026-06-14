/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Member, Transfer } from "../types";
import { Send, ArrowRight, ShieldCheck, Plus, CheckCircle, Trash2, Calendar, MessageSquare, Image, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TransfersViewProps {
  transfers: Transfer[];
  members: Member[];
  onAddTransfer: (transfer: Omit<Transfer, "id">) => void;
  onDeleteTransfer: (transferId: string) => void;
}

export default function TransfersView({
  transfers,
  members,
  onAddTransfer,
  onDeleteTransfer
}: TransfersViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [fromMember, setFromMember] = useState(members[1]?.id || "");
  const [toMember, setToMember] = useState(members[0]?.id || "");
  const [amount, setAmount] = useState<number | "">("");
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = typeof amount === "number" ? amount : 0;
    if (finalAmount <= 0 || fromMember === toMember) return;

    onAddTransfer({
      from: fromMember,
      to: toMember,
      amount: finalAmount,
      date: new Date().toISOString().split("T")[0],
      note: note || undefined,
      proofUrl: proofUrl || undefined
    });

    // Reset
    setAmount("");
    setNote("");
    setProofUrl("");
    setShowAddModal(false);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Peer repayments
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Log direct cash transfers or GPay settlements
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 px-4 py-1.5 rounded-xl text-xs font-semibold text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer"
        >
          <Send size={12} /> Log Repay
        </button>
      </div>

      {/* Advisory bar */}
      <div className="flex gap-3 rounded-2xl border border-slate-900 bg-slate-950/20 p-4 text-xs text-slate-400 leading-relaxed max-w-md">
        💡 <p>Repayments are logged purely between two family members (e.g. Sanket reimbursed Milind). They decrease the net debt owed without affecting other members' shares.</p>
      </div>

      {/* Transfer History List */}
      <div className="space-y-4">
        {transfers.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-10 text-center text-slate-500 text-xs">
            No peer repayments recorded yet. Use repayments to settle debts.
          </div>
        ) : (
          transfers.map(trans => {
            const sender = members.find(m => m.id === trans.from);
            const receiver = members.find(m => m.id === trans.to);

            return (
              <div
                key={trans.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/40 bg-slate-950/10 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {sender?.name}
                    </span>
                    <ArrowRight size={12} className="text-slate-500" />
                    <span className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {receiver?.name}
                    </span>
                  </div>

                  <span className="font-mono text-xs font-bold text-emerald-400">
                    + ₹{trans.amount.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Sub row showing date/reason and delete action */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {trans.date}
                    </span>
                    {trans.note && (
                      <span className="flex items-center gap-1 italic">
                        <MessageSquare size={10} /> {trans.note}
                      </span>
                    )}
                    {trans.proofUrl && (
                      <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                        <Image size={10} /> Receipt Linked
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteTransfer(trans.id)}
                    className="text-slate-500 hover:text-red-400 font-bold font-sans cursor-pointer flex items-center gap-0.5"
                  >
                    <Trash2 size={10} /> Clear
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPREHENSIVE ADD REPAYMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-[2.5rem] border border-slate-800 bg-slate-950 p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <div className="flex items-center gap-1.5 text-indigo-400 font-display text-sm font-bold uppercase tracking-wider">
                <Send size={15} /> Log repayments
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-450 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLocalSubmit} className="space-y-4 text-xs">
              {/* Sender Select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Payer (Who Paid)</label>
                <select
                  value={fromMember}
                  onChange={(e) => setFromMember(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Recipient Select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Recipient (Who Received)</label>
                <select
                  value={toMember}
                  onChange={(e) => setToMember(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Payer and Recipient Equality warning */}
              {fromMember === toMember && (
                <div className="text-[10px] text-red-400 italic">
                  * Sender and Receiver must be different family members.
                </div>
              )}

              {/* Amount Info */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Amount Transferred (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Note</label>
                <input
                  type="text"
                  placeholder="e.g. Settling stay advance"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder-slate-650"
                />
              </div>

              {/* Upload Proof */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Proof Screenshot Upload</label>
                <div className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-3 hover:bg-slate-900/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="text-center text-[10px] text-slate-500">
                    {proofUrl ? (
                      <span className="text-cyan-400 font-semibold">✓ Screen proof recorded</span>
                    ) : (
                      "Attach GPay/Paytm log receipt shot"
                    )}
                  </div>
                </div>
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={fromMember === toMember || (typeof amount === "number" && amount <= 0)}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 disabled:opacity-50 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow shadow-indigo-950 cursor-pointer"
              >
                Save proof & Transfer
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
