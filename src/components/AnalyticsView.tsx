/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Expense, Member, Family } from "../types";
import { calculateBalances } from "../utils/splitUtils";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, PieChart as PieIcon, Award, DollarSign, Calendar, Flame } from "lucide-react";

interface AnalyticsViewProps {
  expenses: Expense[];
  members: Member[];
  families: Family[];
  totalBudget: number;
}

export default function AnalyticsView({
  expenses,
  members,
  families,
  totalBudget
}: AnalyticsViewProps) {
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const { memberBalances } = calculateBalances(members, families, expenses, []);

  // 1. Category-wise calculations
  const categoryDataRecord: Record<string, number> = {};
  expenses.forEach(e => {
    categoryDataRecord[e.category] = (categoryDataRecord[e.category] || 0) + e.amount;
  });

  const categoryChartData = Object.entries(categoryDataRecord).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ["#22d3ee", "#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#3b82f6"];

  // 2. Daily cost trend calculations
  const dailyDataRecord: Record<string, number> = {};
  expenses.forEach(e => {
    // format date to show month day e.g. "20 Jun" or parse straight format
    const displayDate = e.date.substring(5) || e.date; // fallback slice
    dailyDataRecord[displayDate] = (dailyDataRecord[displayDate] || 0) + e.amount;
  });

  const dailyChartData = Object.entries(dailyDataRecord)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 3. Person-wise payments comparison dataset
  const personChartData = memberBalances.map(mb => {
    const name = members.find(m => m.id === mb.memberId)?.name || mb.memberId;
    return {
      name,
      Paid: mb.paid,
      Owed: mb.owed
    };
  });

  // Insights computations
  const highestSpenderObj = memberBalances.reduce((prev, curr) => (curr.paid > prev.paid ? curr : prev), { paid: 0, memberId: "" });
  const highestSpenderName = members.find(m => m.id === highestSpenderObj.memberId)?.name || "N/A";

  const highestDayObj = dailyChartData.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), { amount: 0, date: "N/A" });

  const highestCategoryObj = categoryChartData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), { value: 0, name: "N/A" });

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight text-white">
          Cost Insights & Analytics
        </h2>
        <p className="font-sans text-xs text-slate-400">
          Visual breakdowns of trip accounts, budget ceilings, and categories
        </p>
      </div>

      {/* Numerical core highlight indicators */}
      <div className="grid gap-3.5 grid-cols-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Award size={11} className="text-amber-400" /> King Payer
          </div>
          <div className="font-display text-sm font-bold text-white">{highestSpenderName}</div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold block">₹{Math.round(highestSpenderObj.paid).toLocaleString("en-IN")} logged</span>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-4 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Calendar size={11} className="text-cyan-400" /> Costly Day
          </div>
          <div className="font-display text-sm font-bold text-white">{highestDayObj.date}</div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold block">₹{Math.round(highestDayObj.amount).toLocaleString("en-IN")} spent</span>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-4 space-y-1 col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Flame size={11} className="text-pink-400" /> Heavy Category
          </div>
          <div className="font-display text-sm font-bold text-white">{highestCategoryObj.name}</div>
          <span className="text-[10px] font-mono text-slate-400 font-semibold block">₹{Math.round(highestCategoryObj.value).toLocaleString("en-IN")} total</span>
        </div>
      </div>

      {/* Category Breakdown (Donut Chart) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
          <PieIcon size={14} className="text-cyan-400" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">Category Cost share</h3>
        </div>

        <div className="h-56 w-full flex items-center justify-center">
          {categoryChartData.length === 0 ? (
            <div className="text-slate-550 text-xs">Waiting for cost logs to analyze...</div>
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#09090b", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px", color: "#f8fafc" }}
                  formatter={(val: number) => [`₹${val.toLocaleString("en-IN")}`, "Spent"]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "10px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily cost trend line graph */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
          <TrendingUp size={14} className="text-indigo-400" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">Daily spending timeline</h3>
        </div>

        <div className="h-56 w-full flex items-center justify-center">
          {dailyChartData.length === 0 ? (
            <div className="text-slate-550 text-xs">Waiting for cost logs to calculate timeline...</div>
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <LineChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#475569" style={{ fontSize: "9px" }} />
                <YAxis stroke="#475569" style={{ fontSize: "9px" }} />
                <Tooltip
                  contentStyle={{ background: "#09090b", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px", color: "#f8fafc" }}
                  formatter={(val: number) => [`₹${val}`, "Daily Cost"]}
                />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Person-wise spent comparison (Bar Chart) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5 space-y-3.5 backdrop-blur-md">
        <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
          <DollarSign size={14} className="text-emerald-400" />
          <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-300">Person-wise Paid vs Owed</h3>
        </div>

        <div className="h-56 w-full flex items-center justify-center font-sans">
          {personChartData.length === 0 ? (
            <div className="text-slate-550 text-xs">No person balances logged yet.</div>
          ) : (
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={personChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#475569" style={{ fontSize: "9px" }} />
                <YAxis stroke="#475569" style={{ fontSize: "9px" }} />
                <Tooltip
                  contentStyle={{ background: "#09090b", borderColor: "#1e293b", borderRadius: "12px", fontSize: "11px", color: "#f8fafc" }}
                />
                <Legend iconType="rect" wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="Paid" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Owed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
