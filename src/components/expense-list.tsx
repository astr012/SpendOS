"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Package } from "lucide-react";
import ExpenseItem from "./expense-item";
import { Expense } from "../types/expense";
import { CATEGORIES } from "../lib/constants";
import { motion, AnimatePresence } from "framer-motion";

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  deletingId: string | null;
}

export default function ExpenseList({ expenses, onDelete, onEdit, deletingId }: ExpenseListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: expenses.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 88, // estimated height of an item (including gap)
    overscan: 5,
  });

  if (expenses.length === 0) {
    return (
      <div className="py-20 text-center text-white/30 bg-white/[0.03] border border-dashed border-white/15 rounded-2xl flex flex-col items-center justify-center">
        <Package className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-mono text-sm tracking-widest uppercase">No matching transactions</p>
        <p className="text-xs mt-2 text-white/40">Try changing filters or search keywords.</p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="custom-scrollbar h-[500px] overflow-y-auto"
      style={{
        contain: 'strict',
      }}
    >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const expense = expenses[virtualItem.index];
            const cat = CATEGORIES.find((c) => c.id === expense.category) ?? CATEGORIES[CATEGORIES.length - 1];
            const Icon = cat.icon;

            return (
              <div
                key={expense.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: '16px' // 1rem gap
                }}
              >
                  <ExpenseItem
                    expense={expense}
                    icon={Icon}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isDeleting={deletingId === expense.id}
                  />
              </div>
            );
          })}
        </div>
    </div>
  );
}
