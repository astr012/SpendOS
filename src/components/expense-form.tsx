"use client";

import { useState } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";
import CategoryPill from "./category-pill";
import { CATEGORIES } from "../lib/constants";
import { CURRENCIES } from "../lib/currency";

interface ExpenseFormProps {
  formData: { amount: string; category: string; date: string; note: string };
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  submitError: string | null;
  currencyCode: string;
}

export default function ExpenseForm({ formData, setFormData, onSubmit, isSubmitting, submitError, currencyCode }: ExpenseFormProps) {
  const isInvalidAmount = !formData.amount || Number(formData.amount) <= 0 || Number.isNaN(Number(formData.amount));
  const isSubmitDisabled = isSubmitting || isInvalidAmount || !formData.date;
  const currencySymbol = CURRENCIES.find(c => c.value === currencyCode)?.symbol || "₹";

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 md:mt-auto space-y-6 bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-2xl shadow-2xl hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all"
    >
      {/* Amount */}
      <div className="relative group">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl md:text-5xl text-white/20 font-light transition-colors group-focus-within:text-[#D4FF00]">
          {currencySymbol}
        </span>
        <input
          type="number"
          step="0.01"
          min="0"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full bg-transparent text-5xl md:text-7xl font-light tracking-tighter text-white outline-none focus:ring-0 pl-10 md:pl-16 placeholder:text-white/10"
          placeholder="0.00"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
        {CATEGORIES.map((cat) => {
          const active = formData.category === cat.id;
          const Icon = cat.icon;
          return (
            <CategoryPill
              key={cat.id}
              id={cat.id}
              icon={Icon}
              isActive={active}
              onClick={() => setFormData({ ...formData, category: cat.id })}
            />
          );
        })}
      </div>

      {/* Date & Note */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="date"
          required
          aria-label="Expense date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="date-input-dark bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white/70 font-mono text-xs outline-none focus:border-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00]/20 hover:border-white/20 transition-all w-full sm:w-2/5"
        />
        <input
          type="text"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          placeholder="Add a note..."
          className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00]/20 hover:border-white/20 transition-all w-full sm:w-3/5 placeholder:text-white/30"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full bg-white text-black hover:bg-[#D4FF00] hover:shadow-[0_0_28px_rgba(212,255,0,0.35)] font-bold uppercase tracking-[0.2em] py-5 rounded-2xl transition-all duration-200 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] group"
      >
        {isSubmitting
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : "Log Transaction"}
        {!isSubmitting && (
          <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        )}
      </button>
      {submitError && (
        <p className="text-sm text-[#ff6b6b] bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 rounded-xl px-4 py-3">
          {submitError}
        </p>
      )}
    </form>
  );
}
