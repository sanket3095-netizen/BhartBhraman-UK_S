/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PackingItem } from "../types";
import { 
  CheckSquare, Square, Plus, Trash2, Tag, 
  Layers, Filter, RefreshCw, Loader2, AlertCircle, Sparkles
} from "lucide-react";

export default function PackingList() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New item inputs
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [packedBy, setPackedBy] = useState("");

  const categories = ["Clothing", "Electronics", "Documents", "Health & Toiletries", "Snacks & Others"];

  // Load packing list items
  const loadPackingList = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/packing");
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        throw new Error("Could not load packing items.");
      }
    } catch (err: any) {
      console.error("Packing load error:", err);
      setError("Failed to fetch packing list. Showing local list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackingList();
  }, []);

  // Toggle item packing status
  const handleToggle = async (item: PackingItem) => {
    // Optimistic state update
    const updatedStatus = !item.status;
    const updatedItem = { ...item, status: updatedStatus };
    
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? updatedItem : i))
    );

    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) {
        console.error("Postgres failed to save packing state.");
      }
    } catch (e) {
      console.error("Network packing toggle failed:", e);
    }
  };

  // Add new checklist item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const newItem: PackingItem = {
      id: `pack-${Date.now()}`,
      title: title.trim(),
      category: category,
      status: false,
      packedBy: packedBy.trim() || undefined,
    };

    try {
      const response = await fetch("/api/packing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        setItems((prev) => [...prev, newItem]);
        setTitle("");
        setPackedBy("");
      } else {
        throw new Error("Failed to persist item.");
      }
    } catch (err: any) {
      setError(`Failed to save item: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const response = await fetch(`/api/packing/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        console.error("Postgres failed to delete packing item.");
      }
    } catch (e) {
      console.error("Network packing deletion failed:", e);
    }
  };

  // Group items by category
  const groupedItems = categories.reduce<Record<string, PackingItem[]>>((acc, cat) => {
    acc[cat] = items.filter((item) => item.category === cat);
    return acc;
  }, {});

  // General counts
  const totalItemsCount = items.length;
  const packedCount = items.filter((i) => i.status).length;
  const packedPct = totalItemsCount > 0 ? Math.round((packedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <CheckSquare className="text-emerald-500 h-6 w-6" /> Packing List
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Coordinated family checklist synced to postgres
          </p>
        </div>
        <button
          onClick={loadPackingList}
          disabled={loading}
          className="p-2 w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          title="Refresh List"
        >
          <RefreshCw size={16} className={loading ? "animate-spin text-emerald-500" : ""} />
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-950/20 border border-red-500/30 p-4 text-sm text-red-300 flex items-start gap-2.5">
          <AlertCircle className="shrink-0 text-red-500 mt-0.5" size={17} />
          <div>{error}</div>
        </div>
      )}

      {/* Progress Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-5 space-y-3 shadow">
        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
          <span>Overall packing progression</span>
          <span className="text-emerald-400 font-bold">{packedCount} of {totalItemsCount} packed ({packedPct}%)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${packedPct}%` }}
          />
        </div>
        {packedPct === 100 && totalItemsCount > 0 && (
          <p className="text-xs text-green-400 font-bold flex items-center gap-1.5 animate-pulse">
            <Sparkles size={13} /> Excellent! Every single friend is fully equipped for Pahadi trip.
          </p>
        )}
      </div>

      {/* Quick Add Form inline */}
      <form onSubmit={handleAddItem} className="rounded-2xl border border-slate-850 bg-slate-900/10 p-4 space-y-3 shadow">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Tag size={13} className="text-emerald-500" /> Quick Add travel gear
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="text"
            required
            placeholder="e.g. Heavy gloves / Cold face cream"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Who brings?"
              value={packedBy}
              onChange={(e) => setPackedBy(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-2 text-xs text-white placeholder-slate-705 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold uppercase text-xs tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />} Add item to checklist
        </button>
      </form>

      {/* Categories Group list */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
          <Loader2 className="animate-spin text-emerald-500 h-8 w-8" />
          <p className="text-sm font-medium">Checking live family baggage status...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => {
            const catItems = groupedItems[cat] || [];
            const catCompleted = catItems.length > 0 && catItems.every((i) => i.status);
            
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1 px-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Layers size={13} className="text-emerald-400" />
                    <span>{cat}</span>
                    <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded-full text-slate-500 font-mono">
                      {catItems.filter((i) => i.status).length}/{catItems.length}
                    </span>
                  </h4>
                  {catCompleted && (
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">
                      Done
                    </span>
                  )}
                </div>

                {catItems.length === 0 ? (
                  <p className="text-xs text-slate-600 italic py-2 pl-2">No items listed for {cat} yet.</p>
                ) : (
                  <div className="grid gap-2">
                    {catItems.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleToggle(item)}
                        className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          item.status 
                            ? "bg-emerald-950/5 border-emerald-900/30 text-slate-400 line-through" 
                            : "bg-slate-900/10 border-slate-850 hover:border-slate-800 text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.status ? (
                            <CheckSquare className="text-emerald-400 h-5 w-5 shrink-0" />
                          ) : (
                            <Square className="text-slate-600 group-hover:text-emerald-500 h-5 w-5 shrink-0 transition" />
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-medium leading-none">{item.title}</span>
                            {item.packedBy && (
                              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wide mt-0.5">
                                Assigned: {item.packedBy}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // prevent toggle callback
                            handleDeleteItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all shrink-0"
                          title="Delete packing item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
