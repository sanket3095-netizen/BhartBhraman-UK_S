/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ItineraryDay, Expense, Transfer, UploadedDocument, Memory, Member, Family } from "./types";
import {
  INITIAL_MEMBERS,
  INITIAL_FAMILIES,
  INITIAL_HOTELS,
  INITIAL_ITINERARY,
  INITIAL_EXPENSES,
  INITIAL_TRANSFERS,
  INITIAL_DOCUMENTS,
  INITIAL_MEMORIES
} from "./data/initialData";

import Dashboard from "./components/Dashboard";
import ItineraryView from "./components/ItineraryView";
import ExpensesView from "./components/ExpensesView";
import TransfersView from "./components/TransfersView";
import SettlementEngine from "./components/SettlementEngine";
import MapsView from "./components/MapsView";
import MemoriesView from "./components/MemoriesView";
import DocumentsView from "./components/DocumentsView";
import AnalyticsView from "./components/AnalyticsView";
import AIAssistant from "./components/AIAssistant";

import { Home, Calendar, CreditCard, Compass, Camera, FileText, Bot, HelpCircle, X, Award, BarChart3, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<string>("home");
  const [showAiPopover, setShowAiPopover] = useState(false);

  // States with Local File/LocalStorage Cache persistence
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Base read-only members definition
  const members: Member[] = INITIAL_MEMBERS;
  const families: Family[] = INITIAL_FAMILIES;
  const hotels = INITIAL_HOTELS;
  const BUDGET_CEILING = 150000; // ₹1,50,000 Total Group Budget Target

  // Load from Storage
  useEffect(() => {
    const cachedItinerary = localStorage.getItem("bb_itinerary");
    const cachedExpenses = localStorage.getItem("bb_expenses");
    const cachedTransfers = localStorage.getItem("bb_transfers");
    const cachedDocuments = localStorage.getItem("bb_documents");
    const cachedMemories = localStorage.getItem("bb_memories");

    if (cachedItinerary) setItinerary(JSON.parse(cachedItinerary));
    else setItinerary(INITIAL_ITINERARY);

    if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
    else setExpenses(INITIAL_EXPENSES);

    if (cachedTransfers) setTransfers(JSON.parse(cachedTransfers));
    else setTransfers(INITIAL_TRANSFERS);

    if (cachedDocuments) setDocuments(JSON.parse(cachedDocuments));
    else setDocuments(INITIAL_DOCUMENTS);

    if (cachedMemories) setMemories(JSON.parse(cachedMemories));
    else setMemories(INITIAL_MEMORIES);
  }, []);

  // Save changes
  useEffect(() => {
    if (itinerary.length > 0) localStorage.setItem("bb_itinerary", JSON.stringify(itinerary));
  }, [itinerary]);

  useEffect(() => {
    if (expenses.length > 0) localStorage.setItem("bb_expenses", JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    if (transfers.length > 0) localStorage.setItem("bb_transfers", JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    if (documents.length > 0) localStorage.setItem("bb_documents", JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    if (memories.length > 0) localStorage.setItem("bb_memories", JSON.stringify(memories));
  }, [memories]);

  // Operations
  const handleToggleItineraryComplete = (dayId: string) => {
    setItinerary(prev =>
      prev.map(day => (day.id === dayId ? { ...day, completed: !day.completed } : day))
    );
  };

  const handleAddItineraryNote = (dayId: string, noteText: string) => {
    setItinerary(prev =>
      prev.map(day =>
        day.id === dayId ? { ...day, notes: [...day.notes, noteText] } : day
      )
    );
  };

  const handleAddExpense = (expenseData: Omit<Expense, "id">) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExp, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const handleAddTransfer = (transferData: Omit<Transfer, "id">) => {
    const newTrans: Transfer = {
      ...transferData,
      id: `trans-${Date.now()}`
    };
    setTransfers(prev => [newTrans, ...prev]);
  };

  const handleDeleteTransfer = (transferId: string) => {
    setTransfers(prev => prev.filter(t => t.id !== transferId));
  };

  const handleAddDocument = (docData: Omit<UploadedDocument, "id">) => {
    const newDoc: UploadedDocument = {
      ...docData,
      id: `doc-${Date.now()}`
    };
    setDocuments(prev => [newDoc, ...prev]);
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  const handleAddMemory = (memoryData: Omit<Memory, "id" | "loves">) => {
    const newMem: Memory = {
      ...memoryData,
      loves: 0,
      id: `mem-${Date.now()}`
    };
    setMemories(prev => [newMem, ...prev]);
  };

  const handleLoveMemory = (memoryId: string) => {
    setMemories(prev =>
      prev.map(m => (m.id === memoryId ? { ...m, loves: m.loves + 1 } : m))
    );
  };

  const handleDeleteMemory = (memoryId: string) => {
    setMemories(prev => prev.filter(m => m.id !== memoryId));
  };

  const handleQuickTriggerRepay = (settlement: any) => {
    // Triggers direct transfers logged modal/entry natively automatically
    handleAddTransfer({
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
      date: new Date().toISOString().split("T")[0],
      note: "Settle Debt Cleared"
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/35 overflow-x-hidden">
      
      {/* Visual background ambient details */}
      <div className="fixed top-0 left-12 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="fixed bottom-24 right-12 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-slate-950/80 border-x border-slate-900/60 shadow-2xl">
        
        {/* Global application top action header */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/40 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none" onClick={() => setActiveTab("home")}>
            <Compass className="h-5 w-5 text-cyan-400 animate-spin-slow" />
            <span className="font-display text-sm font-black tracking-tight text-white">BHARATBHRAMAN</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("settlements")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all uppercase tracking-wide border ${
                activeTab === "settlements"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                  : "border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white"
              }`}
            >
              <Receipt size={11} /> Settlements
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all uppercase tracking-wide border ${
                activeTab === "analytics"
                  ? "border-indigo-500/40 bg-indigo-505/10 text-indigo-400"
                  : "border-slate-850 bg-slate-900/40 text-slate-400 hover:text-white"
              }`}
            >
              <BarChart3 size={11} /> Analytics
            </button>
          </div>
        </header>

        {/* View Workspace panel mapping */}
        <main className="flex-1 px-5 py-6 overflow-y-auto">
          {activeTab === "home" && (
            <Dashboard
              itinerary={itinerary}
              expenses={expenses}
              hotels={hotels}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenQuickAdd={(type) => {
                if (type === "expense") setActiveTab("expenses");
                else if (type === "document") setActiveTab("documents");
                else if (type === "memory") setActiveTab("memories");
              }}
              totalBudget={BUDGET_CEILING}
            />
          )}

          {activeTab === "itinerary" && (
            <ItineraryView
              itinerary={itinerary}
              onToggleComplete={handleToggleItineraryComplete}
              onAddNote={handleAddItineraryNote}
              members={members}
            />
          )}

          {activeTab === "expenses" && (
            <div className="space-y-6">
              <ExpensesView
                expenses={expenses}
                members={members}
                itinerary={itinerary}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
              />
              <TransfersView
                transfers={transfers}
                members={members}
                onAddTransfer={handleAddTransfer}
                onDeleteTransfer={handleDeleteTransfer}
              />
            </div>
          )}

          {activeTab === "map" && <MapsView />}

          {activeTab === "memories" && (
            <MemoriesView
              memories={memories}
              members={members}
              onAddMemory={handleAddMemory}
              onLoveMemory={handleLoveMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          )}

          {activeTab === "documents" && (
            <DocumentsView
              documents={documents}
              itinerary={itinerary}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeTab === "settlements" && (
            <SettlementEngine
              expenses={expenses}
              transfers={transfers}
              members={members}
              families={families}
              onTriggerSettleRepay={handleQuickTriggerRepay}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsView
              expenses={expenses}
              members={members}
              families={families}
              totalBudget={BUDGET_CEILING}
            />
          )}
        </main>

        {/* Floating AI COMPANION POPULAR BUBBLE */}
        <div className="fixed bottom-24 right-5 sm:right-[calc(50vw-210px)] z-40 select-none">
          <button
            onClick={() => setShowAiPopover(!showAiPopover)}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-xl hover:scale-105 transition-all outline-none border border-cyan-400 cursor-pointer ${
              showAiPopover ? "rotate-90" : "animate-bounce"
            }`}
          >
            {showAiPopover ? <X size={20} /> : <Bot size={22} />}
          </button>
        </div>

        {/* AI Companion Slide Over/Modal Layer */}
        <AnimatePresence>
          {showAiPopover && (
            <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/80 backdrop-blur-xs p-4">
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                className="w-full max-w-md bg-slate-950 border border-slate-900 rounded-[2.5rem] p-5 shadow-2xl space-y-4"
              >
                <div className="flex justify-end">
                  <button onClick={() => setShowAiPopover(false)} className="text-slate-500 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>
                <AIAssistant
                  members={members}
                  itinerary={itinerary}
                  expenses={expenses}
                  documents={documents}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    setShowAiPopover(false);
                  }}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Bottom Navigation bar */}
        <nav className="sticky bottom-0 z-30 bg-slate-950/90 backdrop-blur-md border-t border-slate-900/40 px-3 py-3 flex items-center justify-around">
          {[
            { id: "home", label: "Home", icon: <Home size={18} /> },
            { id: "itinerary", label: "Plan", icon: <Calendar size={18} /> },
            { id: "expenses", label: "Spend", icon: <CreditCard size={18} /> },
            { id: "map", label: "Map", icon: <Compass size={18} /> },
            { id: "memories", label: "Albums", icon: <Camera size={18} /> },
            { id: "documents", label: "Wallet", icon: <FileText size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center p-1 cursor-pointer transition-all ${
                activeTab === tab.id ? "text-cyan-400 scale-105" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-display font-medium mt-1 uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>

      </div>
    </div>
  );
}
