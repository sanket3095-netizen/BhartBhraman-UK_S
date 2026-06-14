/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Member, Family, Expense, Transfer, Settlement } from "../types";
import { calculateBalances, simplifyDebts } from "../utils/splitUtils";
import { Scale, Users, CheckCircle, Share2, FileSpreadsheet, FileText, ArrowRight, Wallet, Check, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface SettlementEngineProps {
  expenses: Expense[];
  transfers: Transfer[];
  members: Member[];
  families: Family[];
  onTriggerSettleRepay: (settlement: Settlement) => void;
}

export default function SettlementEngine({
  expenses,
  transfers,
  members,
  families,
  onTriggerSettleRepay
}: SettlementEngineProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [activeTab, setActiveTab] = useState<"people" | "families">("people");

  // Run Calculations
  const { memberBalances, familyBalances } = calculateBalances(members, families, expenses, transfers);
  const settlements = simplifyDebts(memberBalances, members);

  // Generate WhatsApp summary formatted text
  const generateWhatsAppSummary = () => {
    let summaryText = `*🏔️ BHARATBHRAMAN UTTARAKHAND DEBT SETTLEMENT REPORT 🏔️*\n`;
    summaryText += `*📅 Date:* ${new Date().toLocaleDateString("en-IN")}\n\n`;
    summaryText += `*📊 TRIP BREAKDOWN:*\n`;
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    summaryText += `• *Total Trip Spend:* ₹${totalSpent.toLocaleString("en-IN")}\n`;
    summaryText += `• *Average Per Person Share:* ₹${Math.round(totalSpent / members.length).toLocaleString("en-IN")}\n\n`;

    summaryText += `*🧍 PERSON-WISE BALANCES:*\n`;
    memberBalances.forEach(mb => {
      const name = members.find(m => m.id === mb.memberId)?.name || mb.memberId;
      const amountStr = mb.net > 0 ? `gets back ₹${mb.net}` : `owes ₹${Math.abs(mb.net)}`;
      summaryText += `• ${name}: spent ₹${Math.round(mb.paid)} | ${amountStr}\n`;
    });

    summaryText += `\n*✨ SIMPLIFIED SETTLEMENTS (Minimum Transactions):*\n`;
    if (settlements.length === 0) {
      summaryText += `✅ All settled up! No transactions pending.`;
    } else {
      settlements.forEach((s, idx) => {
        const fromName = members.find(m => m.id === s.from)?.name || s.from;
        const toName = members.find(m => m.id === s.to)?.name || s.to;
        summaryText += `${idx + 1}. *${fromName}* ➡️ GPay *${toName}* : *₹${s.amount.toLocaleString("en-IN")}*\n`;
      });
    }

    summaryText += `\n_Generated via BharatBhraman Family Travel OS._`;

    navigator.clipboard.writeText(summaryText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Export to Excel / CSV trigger
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,From Participant,To Participant,Owed Amount,Reason,Status\r\n";

    settlements.forEach(s => {
      const fromName = members.find(m => m.id === s.from)?.name || s.from;
      const toName = members.find(m => m.id === s.to)?.name || s.to;
      csvContent += `Settlement,${fromName},${toName},${s.amount},Trip Debt Settlement,Pending\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "BharatBhraman_Settlement_Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Title */}
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-white">
          Settlement Ledger
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Debts computed and simplified using standard mathematical matching
        </p>
      </div>

      {/* Action buttons (WhatsApp, CSV) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={generateWhatsAppSummary}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
        >
          {copiedText ? (
            <>
              <Check size={14} /> Copied!
            </>
          ) : (
            <>
              <Share2 size={14} /> Copy to WhatsApp
            </>
          )}
        </button>

        <button
          onClick={exportToCSV}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 py-2.5 text-xs font-semibold text-slate-300 border border-slate-800 transition-all cursor-pointer"
        >
          <FileSpreadsheet size={15} className="text-cyan-400" /> Export CSV Ledger
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900">
        <button
          onClick={() => setActiveTab("people")}
          className={`px-4 py-2 text-xs font-semibold transition-all select-none ${
            activeTab === "people"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Person-wise Balances
        </button>
        <button
          onClick={() => setActiveTab("families")}
          className={`px-4 py-2 text-xs font-semibold transition-all select-none ${
            activeTab === "families"
              ? "text-cyan-400 border-b-2 border-cyan-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Family-wise Splits
        </button>
      </div>

      {/* Balances Display Card */}
      <div className="space-y-3.5">
        {activeTab === "people" ? (
          memberBalances.map(mb => {
            const member = members.find(m => m.id === mb.memberId);
            return (
              <div
                key={mb.memberId}
                className="flex items-center justify-between rounded-2xl border border-slate-800/40 bg-slate-950/15 p-4.5"
              >
                <div className="flex items-center gap-3">
                  <div className="text-xl bg-slate-900 h-9 w-9 flex items-center justify-center rounded-xl border border-slate-800/80">
                    {member?.avatar}
                  </div>
                  <div>
                    <h4 className="font-display text-xs font-bold text-white">{member?.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                      Spent: ₹{Math.round(mb.paid).toLocaleString("en-IN")} | Owed: ₹{Math.round(mb.owed).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {mb.net > 0 ? (
                    <span className="font-mono text-xs font-bold text-emerald-400 block">
                      gets ₹{Math.round(mb.net).toLocaleString("en-IN")}
                    </span>
                  ) : mb.net < 0 ? (
                    <span className="font-mono text-xs font-bold text-red-400 block">
                      owes ₹{Math.round(Math.abs(mb.net)).toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="font-mono text-xs font-semibold text-slate-500 block">
                      Settled up
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          familyBalances.map(fb => (
            <div
              key={fb.familyId}
              className="flex items-center justify-between rounded-2xl border border-slate-800/45 bg-slate-950/15 p-4.5"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg bg-slate-900 h-9 w-9 flex items-center justify-center rounded-xl border border-slate-800/80">
                  🏠
                </div>
                <div>
                  <h4 className="font-display text-xs font-bold text-white truncate max-w-[200px]">
                    {fb.familyName.split(" (")[0]}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Paid: ₹{Math.round(fb.paid).toLocaleString("en-IN")} | Share: ₹{Math.round(fb.owed).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {fb.net > 0 ? (
                  <span className="font-mono text-xs font-bold text-emerald-400 tracking-tight">
                    gets ₹{Math.round(fb.net).toLocaleString("en-IN")}
                  </span>
                ) : fb.net < 0 ? (
                  <span className="font-mono text-xs font-bold text-red-400 tracking-tight">
                    owes ₹{Math.round(Math.abs(fb.net)).toLocaleString("en-IN")}
                  </span>
                ) : (
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    Settle
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* SIMPLIFY DEBT SETTLEMENT REPORT SECTION */}
      <div className="rounded-2.5xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
          <Scale size={16} className="text-cyan-400" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">
            Suggested Minimum Clearing Transfers
          </h3>
        </div>

        {settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-slate-500 text-xs">
            <CheckCircle className="text-emerald-400 h-8 w-8 mb-2 animate-bounce" />
            <span className="font-semibold text-white">All debts are cleared!</span>
            No further settlements needed. Outstanding group is perfectly even.
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((sett, sIdx) => {
              const fromMember = members.find(m => m.id === sett.from);
              const toMember = members.find(m => m.id === sett.to);

              return (
                <div
                  key={sIdx}
                  className="flex flex-col sm:flex-row items-stretch justify-between rounded-xl border border-slate-900 bg-slate-950/60 p-3 text-xs gap-3"
                >
                  <div className="flex items-center gap-2.5 flex-1 select-none">
                    <span className="font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {fromMember?.name}
                    </span>
                    <ArrowRight size={12} className="text-slate-500" />
                    <span className="text-slate-400 text-[11px] font-medium">Pay up GPay</span>
                    <span className="font-bold text-slate-200 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {toMember?.name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-4 shrink-0">
                    <span className="font-mono text-xs font-black text-white">
                      ₹{sett.amount.toLocaleString("en-IN")}
                    </span>

                    <button
                      onClick={() => onTriggerSettleRepay(sett)}
                      className="rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
