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
import HotelTracker from "./components/HotelTracker";
import PackingList from "./components/PackingList";

import { Home, Calendar, CreditCard, Compass, Camera, FileText, Bot, HelpCircle, X, Award, BarChart3, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab ] = useState<string>("home");
  const [showAiPopover, setShowAiPopover] = useState(false);

  // States with Local File/LocalStorage Cache persistence
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);

  // Interactive Trip Start/End Dates state
  const [tripStartDate, setTripStartDate] = useState<string>(() => {
    try {
      return localStorage.getItem("bb_trip_start") || "2026-06-19";
    } catch (e) {
      return "2026-06-19";
    }
  });
  const [tripEndDate, setTripEndDate] = useState<string>(() => {
    try {
      return localStorage.getItem("bb_trip_end") || "2026-06-27";
    } catch (e) {
      return "2026-06-27";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("bb_trip_start", tripStartDate);
    } catch (e) {
      console.warn("Storage writing exception:", e);
    }
  }, [tripStartDate]);

  useEffect(() => {
    try {
      localStorage.setItem("bb_trip_end", tripEndDate);
    } catch (e) {
      console.warn("Storage writing exception:", e);
    }
  }, [tripEndDate]);

  // Base read-only members definition
  const members: Member[] = INITIAL_MEMBERS;
  const families: Family[] = INITIAL_FAMILIES;
  const hotels = INITIAL_HOTELS;
  const BUDGET_CEILING = 150000; // ₹1,50,000 Total Group Budget Target

  // Load from Storage & PostgreSQL DB API
  useEffect(() => {
    let cachedItinerary = null;
    let cachedTransfers = null;
    let cachedDocuments = null;
    let cachedMemories = null;

    try {
      cachedItinerary = localStorage.getItem("bb_itinerary");
      cachedTransfers = localStorage.getItem("bb_transfers");
      cachedDocuments = localStorage.getItem("bb_documents");
      cachedMemories = localStorage.getItem("bb_memories");
    } catch (e) {
      console.warn("Could not read from local storage:", e);
    }

    if (cachedItinerary) {
      try {
        setItinerary(JSON.parse(cachedItinerary));
      } catch (e) {
        setItinerary(INITIAL_ITINERARY);
      }
    } else {
      setItinerary(INITIAL_ITINERARY);
    }

    if (cachedTransfers) {
      try {
        setTransfers(JSON.parse(cachedTransfers));
      } catch (e) {
        setTransfers(INITIAL_TRANSFERS);
      }
    } else {
      setTransfers(INITIAL_TRANSFERS);
    }

    if (cachedDocuments) {
      try {
        setDocuments(JSON.parse(cachedDocuments));
      } catch (e) {
        setDocuments(INITIAL_DOCUMENTS);
      }
    } else {
      setDocuments(INITIAL_DOCUMENTS);
    }

    // Fetch live memories from PostgreSQL via server API
    const loadDbMemories = async () => {
      try {
        const response = await fetch("/api/memories");
        if (response.ok) {
          const data = await response.json();
          setMemories(data);
        } else {
          try {
            const cachedMem = localStorage.getItem("bb_memories");
            if (cachedMem) setMemories(JSON.parse(cachedMem));
            else setMemories(INITIAL_MEMORIES);
          } catch (e) {
            setMemories(INITIAL_MEMORIES);
          }
        }
      } catch (err) {
        console.warn("Could not reach PostgreSQL backend for memories. Using cached/fallback memories:", err);
        try {
          const cachedMem = localStorage.getItem("bb_memories");
          if (cachedMem) setMemories(JSON.parse(cachedMem));
          else setMemories(INITIAL_MEMORIES);
        } catch (e) {
          setMemories(INITIAL_MEMORIES);
        }
      }
    };

    // Fetch live expenses from PostgreSQL via server API
    const loadDbExpenses = async () => {
      try {
        const response = await fetch("/api/expenses");
        if (response.ok) {
          const data = await response.json();
          setExpenses(data);
        } else {
          // Fallback to local storage if API is not fully configured yet
          try {
            const cachedExp = localStorage.getItem("bb_expenses");
            if (cachedExp) setExpenses(JSON.parse(cachedExp));
            else setExpenses(INITIAL_EXPENSES);
          } catch (e) {
            setExpenses(INITIAL_EXPENSES);
          }
        }
      } catch (err) {
        console.warn("Could not reach PostgreSQL backend. Using local storage / fallback data:", err);
        try {
          const cachedExp = localStorage.getItem("bb_expenses");
          if (cachedExp) setExpenses(JSON.parse(cachedExp));
          else setExpenses(INITIAL_EXPENSES);
        } catch (e) {
          setExpenses(INITIAL_EXPENSES);
        }
      }
    };

    loadDbMemories();
    loadDbExpenses();
  }, []);

  // Save changes
  useEffect(() => {
    try {
      if (itinerary.length > 0) localStorage.setItem("bb_itinerary", JSON.stringify(itinerary));
    } catch (e) {
      console.warn("Could not save itinerary to local storage:", e);
    }
  }, [itinerary]);

  useEffect(() => {
    try {
      if (transfers.length > 0) localStorage.setItem("bb_transfers", JSON.stringify(transfers));
    } catch (e) {
      console.warn("Could not save transfers to local storage:", e);
    }
  }, [transfers]);

  useEffect(() => {
    try {
      // Reduce document upload cache image size if stored or catch Quota error safely
      if (documents.length > 0) {
        const simpleDocs = documents.map(d => {
          if (d.url && d.url.startsWith("data:")) {
            return { ...d, url: "" }; // Skip writing raw attachment images to local storage
          }
          return d;
        });
        localStorage.setItem("bb_documents", JSON.stringify(simpleDocs));
      }
    } catch (e) {
      console.warn("Could not save documents to local storage:", e);
    }
  }, [documents]);

  useEffect(() => {
    try {
      if (memories.length > 0) {
        const sanitizedMemories = memories.map(m => {
          // Strip out large raw base64 data urls to prevent QuotaExceededError in localStorage
          if (m.url && m.url.startsWith("data:")) {
            return { ...m, url: "" };
          }
          return m;
        });
        localStorage.setItem("bb_memories", JSON.stringify(sanitizedMemories));
      }
    } catch (e) {
      console.warn("Could not save memories to local storage:", e);
    }
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

  const handleAddExpense = async (expenseData: Omit<Expense, "id">) => {
    const newId = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id: newId
    };

    // Optimistically update frontend state
    setExpenses(prev => [newExp, ...prev]);
    // Also mirror to local storage cache as passive offline safeguard
    try {
      const currentAndNew = [newExp, ...expenses];
      localStorage.setItem("bb_expenses", JSON.stringify(currentAndNew));
    } catch (e) {
      console.warn("Storage write error:", e);
    }

    // Persist to Postgres database via our secure API route
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExp),
      });
      if (!response.ok) {
        console.error("PostgreSQL backend returned non-OK during expense persistence.");
      }
    } catch (err) {
      console.error("Network failure persisting expense to PostgreSQL db:", err);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    // Optimistically update frontend states
    const filtered = expenses.filter(e => e.id !== expenseId);
    setExpenses(filtered);
    try {
      localStorage.setItem("bb_expenses", JSON.stringify(filtered));
    } catch (e) {
      console.warn("Storage write error:", e);
    }

    // Call deletion API on the backend
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error("PostgreSQL backend returned non-OK during expense deletion.");
      }
    } catch (err) {
      console.error("Network failure deleting expense from PostgreSQL db:", err);
    }
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

  const handleAddMemory = async (memoryData: Omit<Memory, "id" | "loves">) => {
    const newMem: Memory = {
      ...memoryData,
      loves: 0,
      id: `mem-${Date.now()}`
    };

    // Optimistically update frontend state
    setMemories(prev => [newMem, ...prev]);

    // Persist to PostgreSQL database via our secure API route
    try {
      const response = await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMem),
      });
      if (!response.ok) {
        console.error("PostgreSQL backend returned non-OK during memory persistence.");
      }
    } catch (err) {
      console.error("Network failure persisting memory to PostgreSQL db:", err);
    }
  };

  const handleLoveMemory = async (memoryId: string) => {
    // Optimistically update frontend state
    setMemories(prev =>
      prev.map(m => (m.id === memoryId ? { ...m, loves: m.loves + 1 } : m))
    );

    // Save to PostgreSQL via secure API route
    try {
      const response = await fetch(`/api/memories/${memoryId}/love`, {
        method: "POST"
      });
      if (!response.ok) {
        console.error("PostgreSQL backend returned non-OK during memory love operation.");
      }
    } catch (err) {
      console.error("Network failure saving memory love to PostgreSQL db:", err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    // Optimistically update frontend state
    setMemories(prev => prev.filter(m => m.id !== memoryId));

    // Delete in PostgreSQL via secure API route
    try {
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        console.error("PostgreSQL backend returned non-OK during memory deletion.");
      }
    } catch (err) {
      console.error("Network failure deleting memory from PostgreSQL db:", err);
    }
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
        
        {/* Elegant Persistent Top Multi-Tab Navigation (DESIGN REFINEMENT) */}
        <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900/40 shadow-sm">
          {/* Brand Row */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-900/20">
            <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setActiveTab("home")}>
              <Compass className="h-5 w-5 text-orange-500 animate-spin-slow" />
              <span className="font-display text-sm font-black tracking-widest text-white">BHARATBHRAMAN</span>
            </div>
            
            <div className="flex items-center gap-1.5 font-sans">
              <button
                onClick={() => setActiveTab("settlements")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition uppercase tracking-wide border ${
                  activeTab === "settlements"
                    ? "border-green-500/40 bg-green-500/10 text-green-400"
                    : "border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white"
                }`}
              >
                Settle
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition uppercase tracking-wide border ${
                  activeTab === "analytics"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-slate-900 bg-slate-900/40 text-slate-400 hover:text-white"
                }`}
              >
                Stats
              </button>
            </div>
          </div>

          {/* Persistent Core App Navigation Links switching tabs instantly */}
          <div className="grid grid-cols-4 text-center px-1 border-slate-900/40">
            {[
              { id: "home", label: "Dashboard" },
              { id: "hotel-tracker", label: "Hotels" },
              { id: "expenses", label: "Expenses" },
              { id: "packing-list", label: "Packing" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id 
                    ? "text-orange-400" 
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="topActiveIndicator" 
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-orange-500 rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

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
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onUpdateStartDate={setTripStartDate}
              onUpdateEndDate={setTripEndDate}
            />
          )}

          {activeTab === "hotel-tracker" && (
            <HotelTracker />
          )}

          {activeTab === "packing-list" && (
            <PackingList />
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
