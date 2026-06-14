/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UploadedDocument, ItineraryDay } from "../types";
import { FileText, Folder, Eye, Download, Search, Tag, Trash2, Plus, X, UploadCloud, Ticket, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DocumentsViewProps {
  documents: UploadedDocument[];
  itinerary: ItineraryDay[];
  onAddDocument: (doc: Omit<UploadedDocument, "id">) => void;
  onDeleteDocument: (docId: string) => void;
}

export default function DocumentsView({
  documents,
  itinerary,
  onAddDocument,
  onDeleteDocument
}: DocumentsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<UploadedDocument["type"] | "all">("all");

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<UploadedDocument["type"]>("ticket");
  const [uploadedBy, setUploadedBy] = useState("Sanket");
  const [linkedDayId, setLinkedDayId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileSize, setFileSize] = useState("0");

  const categories: { id: UploadedDocument["type"] | "all"; label: string; icon: string }[] = [
    { id: "all", label: "All Docs 🗄️", icon: "all" },
    { id: "ticket", label: "Tickets 🎫", icon: "ticket" },
    { id: "voucher", label: "Vouchers 🏨", icon: "voucher" },
    { id: "car_doc", label: "Car Logs 🚗", icon: "car_doc" },
    { id: "id_proof", label: "ID Cards 🪪", icon: "id_proof" },
    { id: "bill", label: "Bills/Receipts 🧾", icon: "bill" }
  ];

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onAddDocument({
      name,
      type,
      url: fileUrl || "#",
      uploadedBy,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      size: fontSizeHelper(fileSize),
      linkedDayId: linkedDayId || undefined
    });

    // Reset Form
    setName("");
    setType("ticket");
    setUploadedBy("Sanket");
    setLinkedDayId("");
    setFileUrl("");
    setFileSize("0");
    setShowAddModal(false);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setName(file.name);
      setFileSize(file.size.toString());
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const fontSizeHelper = (bytesString: string) => {
    const bytes = parseFloat(bytesString);
    if (!bytes) return "1.2 MB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleTriggerSimulatedDownload = (doc: UploadedDocument) => {
    // Generate simple simulated download for local testing
    const link = document.createElement("a");
    link.href = doc.url && doc.url !== "#" ? doc.url : "data:text/plain;charset=utf-8,Simulated Document Content";
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-6">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white">
            Documents Wallet
          </h2>
          <p className="font-sans text-xs text-slate-400">
            Secure digital copies of vouchers, IDs, and car logs
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white cursor-pointer hover:from-cyan-600 hover:to-indigo-600 border border-slate-800 shadow shadow-indigo-950/20"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search and Categories list row */}
      <div className="space-y-3.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search documents by name or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/40 py-2.5 pl-4 pr-10 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
          />
          <Search size={14} className="absolute right-3.5 top-3.5 text-slate-500" />
        </div>

        {/* Categories toggler */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                  : "border-slate-850 bg-slate-900/30 text-slate-500"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of documents lists */}
      <div className="grid gap-3.5">
        {filteredDocs.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500 text-xs">
            No vouchers or document assets match this view description.
          </div>
        ) : (
          filteredDocs.map(doc => {
            const linkedDay = itinerary.find(d => d.id === doc.linkedDayId);

            return (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/15 p-4.5 relative"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Category icon picker visual */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-850 text-cyan-400 text-base">
                    {doc.type === "ticket" && "🎫"}
                    {doc.type === "voucher" && "🏨"}
                    {doc.type === "car_doc" && "🚗"}
                    {doc.type === "id_proof" && "🪪"}
                    {doc.type === "bill" && "🧾"}
                    {doc.type === "screenshot" && "📲"}
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-display text-xs font-bold text-slate-100 truncate pr-4">
                      {doc.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {doc.size} • Uploaded by {doc.uploadedBy} • {doc.date}
                    </p>
                    {linkedDay && (
                      <span className="inline-block mt-1 text-[9px] text-indigo-400 font-semibold bg-indigo-950/40 border border-indigo-950/80 px-2 py-0.5 rounded-md">
                        Linked Day: {linkedDay.date} ({linkedDay.route})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2shrink-0">
                  <button
                    onClick={() => handleTriggerSimulatedDownload(doc)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg hover:text-red-400 text-slate-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* COMPREHENSIVE ADD DOCUMENT MODULE */}
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
                <UploadCloud size={15} /> Add digital document
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-whitea">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleLocalSubmit} className="space-y-4 text-xs">
              {/* Drag Drop File Input */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Preserve File upload</label>
                <div className="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center hover:bg-slate-900/50">
                  <input
                    type="file"
                    required={!name}
                    onChange={handleDocumentUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud size={24} className="text-slate-500 mb-1.5" />
                  <span className="text-[11px] font-semibold text-slate-300">
                    {name ? `Selected: ${name}` : "Click to browse or drop PDF/JPG"}
                  </span>
                  <span className="text-[9px] text-slate-600 mt-0.5">Size Limit: 15MB</span>
                </div>
              </div>

              {/* Editable Name fields if custom naming desired */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Rename Asset</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Vihar Ticket Group.pdf"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-white focus:outline-none"
                />
              </div>

              {/* Type Category selection */}
              <div className="space-y-1 font-display">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Asset Category Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white"
                >
                  <option value="ticket">Ticket (Train, Bus) 🎫</option>
                  <option value="voucher">Stay Voucher (Homestay, Zostel) 🏨</option>
                  <option value="car_doc">Vehicle Docs (Gocars Rent, Car registration) 🚗</option>
                  <option value="id_proof">ID copies (Sanket, Sneha passport/Aadhar) 🪪</option>
                  <option value="bill">Log Receipts (Restaurant, Fuel tickets) 🧾</option>
                </select>
              </div>

              {/* Linked Day */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wide text-slate-400">Day schedule link</label>
                <select
                  value={linkedDayId}
                  onChange={(e) => setLinkedDayId(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">General Document</option>
                  {itinerary.map(day => (
                    <option key={day.id} value={day.id}>{day.date} - {day.route}</option>
                  ))}
                </select>
              </div>

              {/* Save */}
              <button
                type="submit"
                disabled={!name}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow shadow-indigo-950 cursor-pointer"
              >
                Assemble to wallet
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
