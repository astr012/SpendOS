"use client";

import { LucideIcon } from "lucide-react";

interface CategoryPillProps {
  id: string;
  isActive: boolean;
  icon: LucideIcon;
  onClick: () => void;
}

export default function CategoryPill({ id, isActive, icon: Icon, onClick }: CategoryPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-widest transition-all duration-200 flex items-center gap-2 border active:scale-95 hover:-translate-y-0.5 ${
        isActive
          ? "bg-[#D4FF00] text-black border-[#D4FF00] shadow-[0_0_18px_rgba(212,255,0,0.35)]"
          : "bg-white/[0.03] text-white/60 border-white/10 hover:border-white/30 hover:text-white"
      }`}
    >
      <Icon size={14} className={isActive ? "text-black" : "text-white/40"} />
      {id}
    </button>
  );
}
