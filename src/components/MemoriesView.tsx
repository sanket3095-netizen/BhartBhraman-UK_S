/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Member, Memory } from "../types";
import { Heart, Plus, MapPin, Calendar, Camera, BookOpen, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MemoriesViewProps {
  memories: Memory[];
  members: Member[];
  onAddMemory: (memory: Omit<Memory, "id" | "loves">) => void;
  onLoveMemory: (memoryId: string) => void;
  onDeleteMemory: (memoryId: string) => void;
}

export default function MemoriesView({
  memories,
  members,
  onAddMemory,
  onLoveMemory,
  onDeleteMemory
}: MemoriesViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"photo" | "diary">("photo");
  const [location, setLocation] = useState("");
  const [authorId, setAuthorId] = useState(members[0]?.id || "");
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // Default placeholder images matching Uttarakhand forest / mountain themes
    const defaultPlaceholderUrl = type === "photo"
      ? selectedPhoto || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop"
      : "";

    onAddMemory({
      title,
      description: description || undefined,
      type,
      url: defaultPlaceholderUrl,
      location: location || "Uttarakhand",
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      authorId
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setType("photo");
    setLocation("");
    setSelectedPhoto("");
    setShowAddModal(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Travel Diaries & Memories
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Instagram-style photo logs shared by family
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 border border-slate-800 text-white cursor-pointer shadow shadow-indigo-950/20"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Shared Family Story Avatars bubbles row */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
        {members.map(m => {
          // See if they authored any memories
          const hasAuthorPost = memories.some(post => post.authorId === m.id);
          return (
            <div key={m.id} className="flex flex-col items-center shrink-0">
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border text-2xl select-none ${
                  hasAuthorPost
                    ? "border-cyan-500 shadow-sm ring-2 ring-cyan-500/10"
                    : "border-slate-800"
                }`}
              >
                {m.avatar}
                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-slate-950 text-[8px] border border-slate-800 flex items-center justify-center font-bold text-cyan-400">
                  {memories.filter(p => p.authorId === m.id).length}
                </div>
              </div>
              <span className="mt-1.5 font-display text-[10px] text-slate-400 font-semibold">{m.name}</span>
            </div>
          );
        })}
      </div>

      {/* Feed Layout */}
      <div className="grid gap-6 sm:grid-cols-2">
        {memories.map((post) => {
          const author = members.find(m => m.id === post.authorId);

          return (
            <motion.div
              layout
              key={post.id}
              className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/25 p-4.5 space-y-4 backdrop-blur-md relative"
            >
              {/* Image Preview or Diary Icon */}
              {post.type === "photo" && post.url ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2.5xl border border-slate-800 bg-slate-900">
                  <img
                    src={post.url}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/70 border border-slate-850 px-2 py-0.5 rounded text-[8px] font-semibold text-slate-300 backdrop-blur-md uppercase tracking-wider">
                    📸 Photo Capture
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-2.5xl bg-indigo-500/5 border border-indigo-500/10 p-5 space-y-2 relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                    <BookOpen size={15} />
                  </div>
                  <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest font-display">
                    📝 Written Log / Travel Diary
                  </div>
                  <p className="text-[11px] italic text-slate-400 leading-relaxed truncate-3-lines">
                    "{post.description}"
                  </p>
                </div>
              )}

              {/* Text info and authors block */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-white tracking-tight">
                    {post.title}
                  </h3>
                  <button
                    onClick={() => onDeleteMemory(post.id)}
                    className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
                {post.type === "photo" && post.description && (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {post.description}
                  </p>
                )}
              </div>

              {/* Post Metadata row */}
              <div className="flex items-center justify-between border-t border-slate-900/85 pt-3 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-sm">{author?.avatar}</span>
                  <span className="font-sans font-bold text-slate-400">{author?.name}</span>
                  <span className="text-slate-650">•</span>
                  <MapPin size={10} className="text-slate-600" />
                  <span>{post.location}</span>
                </div>

                <div className="flex items-center gap-3 select-none">
                  <button
                    onClick={() => onLoveMemory(post.id)}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Heart size={13} className="text-red-500 fill-red-500" />
                    <span>{post.loves}</span>
                  </button>
                  <span className="font-mono text-[9px] text-slate-600">{post.date}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* COMPREHENSIVE ADD MEMORY / DIARY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-[2.5rem] border border-slate-800 bg-slate-950 p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-900">
              <div className="flex items-center gap-1.5 text-cyan-400 font-display text-sm font-bold uppercase tracking-wider">
                <Camera size={15} /> Add shared memory
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLocalSubmit} className="space-y-4 text-xs">
              {/* Author Select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Who is Author?</label>
                <select
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
                  ))}
                </select>
              </div>

              {/* Type Select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400 font-display">Memory format</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType("photo")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold text-center transition-all ${
                      type === "photo"
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-slate-800 bg-slate-900/30 text-slate-500"
                    }`}
                  >
                    📸 Snap Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("diary")}
                    className={`flex-1 rounded-xl border py-2 text-xs font-semibold text-center transition-all ${
                      type === "diary"
                        ? "border-indigo-505 bg-indigo-505/10 text-indigo-400"
                        : "border-slate-800 bg-slate-900/30 text-slate-500"
                    }`}
                  >
                    📝 Diary Entry
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Caption Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Misty tea at Lokhandi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Logs Detail / Narrative</label>
                <textarea
                  placeholder="Tell the story of this post..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none resize-none"
                />
              </div>

              {/* Geography tag */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Location Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Chilmiri Neck, Chakrata"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Snap Upload */}
              {type === "photo" && (
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Camera / Photo Upload</label>
                  <div className="relative flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-4 hover:bg-slate-900/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="text-center text-[10px] text-slate-500">
                      {selectedPhoto ? (
                        <span className="text-cyan-400 font-semibold">✓ Snapped photograph loaded</span>
                      ) : (
                        "Tap to snap instant mobile picture"
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Save */}
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3 text-center text-xs font-bold uppercase tracking-wider text-white hover:scale-[1.01] transition-transform shadow shadow-indigo-950 cursor-pointer"
              >
                Log shared memory
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
