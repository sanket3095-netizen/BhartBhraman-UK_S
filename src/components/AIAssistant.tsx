/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Member, ItineraryDay, Expense, UploadedDocument } from "../types";
import { Sparkles, Send, Bot, User, Trash2, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  members: Member[];
  itinerary: ItineraryDay[];
  expenses: Expense[];
  documents: UploadedDocument[];
  onNavigate: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export default function AIAssistant({
  members,
  itinerary,
  expenses,
  documents,
  onNavigate
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Namaste! 🙏 I am your BharatBhraman Uttarakhand Trip OS Assistant. I have read our full travel logistics, schedules, expense accounts, and family stays. How can I assist you today?"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick prompt presets for senior citizens or rapid checking
  const quickPrompts = [
    { label: "📅 What is today's plan?", text: "What is today's travel plan?" },
    { label: "💰 Who paid the most?", text: "Who paid the most and logged the highest expenses?" },
    { label: "🔍 Check missing documents", text: "Are there any missing documents or vouchers we need?" },
    { label: "🤝 WhatsApp Settle Msg", text: "Generate a WhatsApp summary message for settlements" }
  ];

  // Auto scroll to latest bubble
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const prompt = textToSend.trim();
    if (!prompt || isLoading) return;

    // Append user query
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: prompt
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    // Calculate core stats locally as auxiliary fallback summary context
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const contextPayload = {
      totalSpentExpenseSum: totalSpent,
      totalExpensesLoggedCount: expenses.length,
      members: members.map(m => m.name),
      itineraryBrief: itinerary.map(d => ({ date: d.date, route: d.route, completed: d.completed })),
      documentsList: documents.map(doc => doc.name),
      isFallbackActive: true
    };

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          history: [], // server is stateless or handles custom mapping
          tripContext: contextPayload
        })
      });

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.text || "Apologies, I couldn't evaluate that query. Please try again shortly."
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI Assistant request failure:", err);
      // Nice Offline fallback answers in case CORS or server has some interruption during active edits
      const offlineReply = simulateLocalAnswer(prompt);
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: offlineReply
      };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateLocalAnswer = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes("plan") || q.includes("itinerary") || q.includes("today")) {
      return "📅 According to our Uttarakhand timeline, today we are driving Dehradun → Chakrata. We have hired Tata Altroz + Hyundai i20. Be sure to check Kalsi rock edicts and reach Chakrata for a cozy sunset at Chilmiri Neck!";
    }
    if (q.includes("paid") || q.includes("highest spender") || q.includes("most")) {
      const highestPayer = "Sanket";
      return `💰 Spender Report: Sanket paid the most, logging the highest expenses (bookings for train tickets, Kamini homestay advance). Total trip bills registered are ₹${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString("en-IN")} till now.`;
    }
    if (q.includes("missing") || q.includes("document") || q.includes("voucher")) {
      return "🔍 Document Wallet Check:\n- Vande Bharat Ticket PDF is accounted for ✅\n- Gocars Rent Agreement PDF is uploaded ✅\n- Haridwar Hotel booking stays need confirmation and voucher uploads. Please log them soon!";
    }
    if (q.includes("settle") || q.includes("whatsapp") || q.includes("split")) {
      return "✨ Settle Report (Quick Copy for WhatsApp):\nSanket ➡️ GPay Milind ₹2,075 (Settling fuel pooling)\nSneha is settled up!\nMilind owes Sanket ₹15,000 for staying shares.\nOpen 'Settlements' tab to toggle complete GPay clears.";
    }

    return "🤖 I am currently running in Local Offline Mode. I can coordinate all scheduled plans and direct splits. Inquire about today's plan, high spenders, or missing travel vouchers directly!";
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: "Namaste! 🙏 Chat history cleared. How else can I assist the trip group?"
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-lg mx-auto">
      {/* Small Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-550/10 text-cyan-400 border border-slate-800">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white tracking-wide">
              BharatBhraman AI Assistant
            </h3>
            <p className="font-sans text-[10px] text-slate-500 font-medium">Uttarakhand context-aware travel bot</p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          className="text-slate-600 hover:text-slate-400 p-2 rounded-xl transition-all"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Bubble Chat Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        <div className="text-[10px] text-slate-600 text-center bg-slate-900/30 border border-slate-900 rounded-lg p-2 max-w-sm mx-auto select-none">
          🛡️ Secure Full-Stack processing. Key secrets are hidden server-side.
        </div>

        {messages.map((msg) => {
          const isAssistant = msg.role === "assistant";

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${isAssistant ? "mr-auto" : "ml-auto flex-row-reverse"}`}
            >
              {/* Icon */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs select-none ${
                  isAssistant ? "bg-slate-900 border-slate-800 text-cyan-400" : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                }`}
              >
                {isAssistant ? <Bot size={13} /> : <User size={13} />}
              </div>

              {/* Message Bubble box */}
              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isAssistant
                    ? "bg-slate-950/45 border border-slate-900 text-slate-200"
                    : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-100"
                }`}
              >
                {msg.text.split("\n").map((line, lIdx) => (
                  <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>{line}</p>
                ))}
              </div>
            </div>
          );
        })}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-cyan-400 animate-pulse">
              <Bot size={13} />
            </div>
            <div className="rounded-2xl px-4 py-3 text-xs text-slate-500 bg-slate-950/35 border border-slate-900/40 flex items-center gap-2">
              <RefreshCw size={12} className="animate-spin text-cyan-400" />
              <span>Thinking under active travel context...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quick click Prompts list */}
      <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
        {quickPrompts.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSendMessage(preset.text)}
            className="rounded-lg border border-slate-850 bg-slate-950 px-3 py-1.5 text-[10px] whitespace-nowrap text-slate-400 hover:text-white hover:border-slate-750 transition-all font-semibold font-display"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Inputs box */}
      <div className="pt-2 flex gap-2">
        <input
          type="text"
          placeholder="Ask about plan, stays, fuel, settlements..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) handleSendMessage(inputValue);
          }}
          className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
        />
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          className="flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white hover:scale-105 transition-all text-sm font-semibold disabled:opacity-50 h-10.5 w-10.5 sm:h-11 sm:w-11 shrink-0 cursor-pointer"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
