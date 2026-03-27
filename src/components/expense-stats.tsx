"use client";

import { formatCurrency } from "../lib/currency";

interface ExpenseStatsProps {
  monthlyTotal: number;
  avgExpense: number;
  filteredCount: number;
  currencyCode: string;
}

export default function ExpenseStats({ monthlyTotal, avgExpense, filteredCount, currencyCode }: ExpenseStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
        <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">This Month</p>
        <p className="text-sm font-semibold">{formatCurrency(monthlyTotal, currencyCode)}</p>
      </div>
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
        <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">Average</p>
        <p className="text-sm font-semibold">{formatCurrency(avgExpense, currencyCode)}</p>
      </div>
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
        <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">Filtered</p>
        <p className="text-sm font-semibold">{filteredCount}</p>
      </div>
    </div>
  );
}
