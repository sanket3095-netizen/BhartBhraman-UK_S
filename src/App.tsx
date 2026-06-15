/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Expense, Transfer, UploadedDocument, Memory } from "./types";
import { useSync } from "./context/SyncContext";
import LoginView from "./components/LoginView";

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

import { Home, Calendar, CreditCard, Compass, Camera, FileText, Bot, X, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const {
    syncStatus,
    activeUser,
    isAuthenticated,
    tripStartDate,
    tripEndDate,
    updateTripDates,
    members,
    families,
    itinerary,
    expenses,
    transfers,
    documents,
    memories,
    hotels,
    saveExpense,
    deleteExpense,
    saveTransfer,
    deleteTransfer,
    saveDocument,
    deleteDocument,
    saveMemory,
    loveMemory,
    deleteMemory,
    toggleItineraryComplete,
    addItineraryNote,
    logout,
    firebaseError,
    tryEnableFirebase
  } = useSync();

  // Navigation tabs
  const [activeTab, setActiveTab ] = useState<string>("home");
  const [showAiPopover, setShowAiPopover] = useState(false);
  const BUDGET_CEILING = 150000; // ₹1,50,000 Total Group Budget Target

  // Operations
  const handleToggleItineraryComplete = (dayId: string) => {
    toggleItineraryComplete(dayId);
  };

  const handleAddItineraryNote = (dayId: string, noteText: string) => {
    addItineraryNote(dayId, noteText);
  };

  const handleAddExpense = async (expenseData: Omit<Expense, "id">) => {
    await saveExpense(expenseData);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await deleteExpense(expenseId);
  };

  const handleAddTransfer = async (transferData: Omit<Transfer, "id">) => {
    await saveTransfer(transferData);
  };

  const handleDeleteTransfer = async (transferId: string) => {
    await deleteTransfer(transferId);
  };

  const handleAddDocument = async (docData: Omit<UploadedDocument, "id">) => {
    await saveDocument(docData);
  };

  const handleDeleteDocument = async (docId: string) => {
    await deleteDocument(docId);
  };

  const handleAddMemory = async (memoryData: Omit<Memory, "id" | "loves">) => {
    await saveMemory({ ...memoryData, loves: 0 });
  };

  const handleLoveMemory = async (memoryId: string) => {
    await loveMemory(memoryId);
  };

  const handleDeleteMemory = async (memoryId: string) => {
    await deleteMemory(memoryId);
  };

  const handleQuickTriggerRepay = (settlement: any) => {
    handleAddTransfer({
      from: settlement.from,
      to: settlement.to,
      amount: settlement.amount,
      date: new Date().toISOString().split("T")[0],
      note: "Settle Debt Cleared"
    });
  };

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-5 font-sans relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/60 border border-red-500/30 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30 shadow-lg mb-2">
            <span className="text-2xl font-bold">⚠️</span>
          </div>
          <h1 className="font-display text-lg font-black tracking-widest text-red-400 uppercase leading-relaxed">
            Firebase sync not connected
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Real-time synchronization for Uttarakhand 2026 trip is disconnected. We need a live connection to manage itinerary and expenses for all 8 family members.
          </p>

          <div className="bg-slate-950/80 rounded-2xl p-4 text-left text-[11px] text-slate-400 border border-slate-900/40 leading-relaxed font-sans space-y-2">
            <span className="text-amber-400 font-bold block">How to enable real-time sync:</span>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>Open the <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 font-bold hover:underline">Firebase Console</a>.</li>
              <li>Navigate to <strong>Build &rarr; Authentication &rarr; Sign-in method</strong>.</li>
              <li>Click <strong>Add new provider</strong>, select <strong>Anonymous</strong>, click <strong>Enable</strong>, and click <strong>Save</strong>.</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={async () => {
                const ok = await tryEnableFirebase();
                if (ok) {
                  alert("Sync reconnected and activated successfully!");
                } else {
                  alert("Could not activate sync. Note: Verify Anonymous Auth is enabled in the Firebase Console first!");
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs py-3 rounded-2xl transition shadow-lg cursor-pointer"
            >
              Retry Firebase Sync Connection
            </button>
          </div>

          <div className="text-[10px] text-slate-500 font-mono break-all bg-slate-950/45 p-2 rounded-xl">
            {firebaseError}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !activeUser) {
    return <LoginView />;
  }

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
              <div>
                <span className="font-display text-sm font-black tracking-widest text-white">BHARATBHRAMAN</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    syncStatus === "Online & Synced" ? "bg-emerald-500" :
                    syncStatus === "Syncing" ? "bg-cyan-500 animate-pulse" :
                    syncStatus === "Offline - pending changes" ? "bg-yellow-500 animate-pulse" : "bg-red-500 animate-pulse"
                  }`} />
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                    {syncStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 font-sans">
              <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/40 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-300">
                <span className="text-xs">{activeUser?.avatar}</span>
                <span className="max-w-[50px] truncate">{activeUser?.name}</span>
              </div>
              
              <button
                onClick={() => logout()}
                title="Logout / Change user"
                className="p-1 rounded-lg border border-slate-900 bg-slate-900/40 text-slate-400 hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/10 transition cursor-pointer"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>

          {/* Persistent Core App Navigation Links switching tabs instantly */}
          <div className="flex items-center gap-1 overflow-x-auto px-4 border-b border-slate-900/20 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "home", label: "Dashboard" },
              { id: "hotel-tracker", label: "Hotels" },
              { id: "expenses", label: "Expenses" },
              { id: "settlements", label: "Splits" },
              { id: "analytics", label: "Analysis" },
              { id: "packing-list", label: "Packing" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3.5 px-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  activeTab === tab.id 
                    ? "text-orange-400 font-extrabold" 
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
              onUpdateStartDate={(start) => updateTripDates(start, tripEndDate)}
              onUpdateEndDate={(end) => updateTripDates(tripStartDate, end)}
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
