"use client";

import { X, Check, Loader2 } from "lucide-react";
import { CATEGORIES } from "../lib/constants";

import { motion } from "framer-motion";

import CustomSelect from "../components/custom-select";

const CATEGORY_OPTIONS = CATEGORIES.map(cat => ({ label: cat.id, value: cat.id }));

interface EditExpenseModalProps {
  editData: { amount: string; category: string; date: string; note: string };
  setEditData: (data: any) => void;
  onSave: () => void;
  onClose: () => void;
  savingEdit: boolean;
}

export default function EditExpenseModal({ editData, setEditData, onSave, onClose, savingEdit }: EditExpenseModalProps) {
  const isInvalid = !editData.amount || Number(editData.amount) <= 0 || Number.isNaN(Number(editData.amount));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-[#0b0b0b] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold tracking-tight">Edit Transaction</h4>
          <button onClick={onClose} aria-label="Close edit dialog" className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          value={editData.amount}
          onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-all font-mono"
          placeholder="Amount"
        />
        <div className="flex gap-4 relative z-10 w-full">
          <CustomSelect
            value={editData.category}
            onChange={(val) => setEditData({ ...editData, category: val })}
            options={CATEGORY_OPTIONS}
            className="flex-1"
          />
          <input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
            aria-label="Edit date"
            className="date-input-dark flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4FF00] hover:border-white/20 transition-all font-mono text-sm"
          />
        </div>
        <input
          type="text"
          value={editData.note}
          onChange={(e) => setEditData({ ...editData, note: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-all"
          placeholder="Note (optional)"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={savingEdit || isInvalid}
            className="px-5 py-2.5 rounded-xl bg-[#D4FF00] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(212,255,0,0.35)] transition-all disabled:opacity-50 inline-flex items-center gap-2 text-sm"
          >
            {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
