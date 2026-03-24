"use client";

import { Trash2, LucideIcon, Pencil } from "lucide-react";
import { Expense } from "../types/expense";
import { formatINR } from "../lib/currency";

interface ExpenseItemProps {
  expense: Expense;
  icon: LucideIcon;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  isDeleting: boolean;
}

export default function ExpenseItem({ expense, icon: Icon, onDelete, onEdit, isDeleting }: ExpenseItemProps) {
  return (
    <div
      className={`group flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 ${
        isDeleting
          ? "opacity-0 translate-x-2 pointer-events-none border-transparent"
          : "opacity-100 translate-x-0 border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
      }`}
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center text-white/40 group-hover:text-[#D4FF00] group-hover:bg-[#D4FF00]/10 transition-colors shrink-0 border border-white/5 hover:border-white/10">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className="font-medium text-base tracking-tight mb-1 truncate">{expense.note || expense.category}</div>
          <div className="flex items-center gap-3 text-xs font-mono text-white/40">
            <span className="uppercase tracking-widest">{expense.category}</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>
              {new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-mono text-lg tracking-tight text-white/90">{formatINR(expense.amount)}</span>
        <button
          onClick={() => onEdit(expense.id)}
          className="p-2 text-white/30 hover:text-[#D4FF00] hover:bg-[#D4FF00]/10 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 active:scale-95"
          aria-label="Edit expense"
          disabled={isDeleting}
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(expense.id)}
          className="p-2 text-white/30 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-xl transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 active:scale-95"
          aria-label="Delete expense"
          disabled={isDeleting}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
