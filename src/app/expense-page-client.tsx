"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Trash2, Wallet, Loader2, Coffee, Car, Zap, Tv,
  ShoppingBag, Package, ArrowUpRight, TrendingDown,
} from "lucide-react";
import { signIn } from "../services/authService";
import { subscribeToExpenses, addExpense, deleteExpense } from "../services/expenseService";
import { Expense } from "../types/expense";

const appId = process.env.NEXT_PUBLIC_APP_ID ?? "default-app";

const CATEGORIES = [
  { id: "Food",          icon: Coffee },
  { id: "Transport",     icon: Car },
  { id: "Utilities",     icon: Zap },
  { id: "Entertainment", icon: Tv },
  { id: "Shopping",      icon: ShoppingBag },
  { id: "Other",         icon: Package },
];

export default function ExpensePageClient() {
  const [user, setUser]             = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData]     = useState({
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth
  useEffect(() => {
    signIn()
      .then((c) => { setUser(c.user); setAuthLoading(false); })
      .catch(() => setAuthLoading(false));
  }, []);

  // Snapshot
  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    const unsub = subscribeToExpenses(
      user.uid, appId,
      (list) => { setExpenses(list); setLoadingData(false); },
      (err)  => { console.error(err); setLoadingData(false); }
    );
    return () => unsub();
  }, [user]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.amount || isNaN(Number(formData.amount))) return;
    setIsSubmitting(true);
    try {
      await addExpense(user.uid, appId, {
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        note: formData.note,
      });
      setFormData((p) => ({ ...p, amount: "", note: "" }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try { await deleteExpense(user.uid, appId, id); }
    catch (err) { console.error(err); }
  };

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

  // Auth error
  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-white">
        <div className="bg-white/5 border border-white/10 p-12 rounded-3xl max-w-md w-full text-center">
          <Wallet className="w-16 h-16 text-[#ff4d4d] mx-auto mb-6" />
          <h1 className="text-2xl font-light tracking-tight mb-2">Connection Lost</h1>
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">Database access denied</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#D4FF00] selection:text-black flex flex-col md:flex-row overflow-hidden relative">

      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#D4FF00]/5 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ── LEFT PANEL ── */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 md:p-12 relative z-10 h-auto md:h-screen md:sticky top-0">

        {/* Header */}
        <header className="flex items-center justify-between mb-16 md:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase">Session Active</span>
          </div>
          <div className="font-mono text-xs text-white/30 tracking-widest">
            ID: {user.uid.slice(0, 8).toUpperCase()}
          </div>
        </header>

        {/* Hero total */}
        <div className="mt-8 md:mt-0">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <TrendingDown size={16} className="text-[#D4FF00]" />
            <h2 className="text-sm font-mono uppercase tracking-[0.2em]">Net Outflow</h2>
          </div>
          <h1 className="text-[15vw] md:text-[8vw] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30">
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleAddExpense}
          className="mt-16 md:mt-auto space-y-8 bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2rem] backdrop-blur-2xl shadow-2xl"
        >
          {/* Amount */}
          <div className="relative group">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl md:text-5xl text-white/20 font-light transition-colors group-focus-within:text-[#D4FF00]">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-transparent text-5xl md:text-7xl font-light tracking-tighter text-white outline-none pl-10 md:pl-16 placeholder:text-white/10"
              placeholder="0.00"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {CATEGORIES.map((cat) => {
              const active = formData.category === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className={`px-4 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    active
                      ? "bg-[#D4FF00] text-black border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.3)]"
                      : "bg-transparent text-white/50 border-white/10 hover:border-white/30 hover:text-white"
                  }`}
                >
                  <Icon size={14} className={active ? "text-black" : "text-white/40"} />
                  {cat.id}
                </button>
              );
            })}
          </div>

          {/* Date & Note */}
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white/70 font-mono text-sm outline-none focus:border-[#D4FF00] transition-colors w-full sm:w-2/5"
              style={{ colorScheme: "dark" }}
            />
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note..."
              className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#D4FF00] transition-colors w-full sm:w-3/5 placeholder:text-white/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-black hover:bg-[#D4FF00] font-bold uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex justify-center items-center gap-3 disabled:opacity-50 group"
          >
            {isSubmitting
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : "Log Transaction"}
            {!isSubmitting && (
              <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            )}
          </button>
        </form>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full md:w-1/2 md:h-screen md:overflow-y-auto bg-white/[0.02] border-l border-white/5 relative z-10 custom-scrollbar">
        <div className="sticky top-0 h-12 bg-gradient-to-b from-[#050505] to-transparent z-20 pointer-events-none" />
        <div className="p-6 md:p-12 pt-0">

          {/* Ledger header */}
          <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
            <h3 className="text-2xl font-light tracking-tight text-white/80">Ledger</h3>
            <div className="text-[#D4FF00] text-sm font-mono bg-[#D4FF00]/10 px-3 py-1 rounded-full">
              {expenses.length} Records
            </div>
          </div>

          {loadingData ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-20 text-center text-white/30">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono text-sm tracking-widest uppercase">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => {
                const cat = CATEGORIES.find((c) => c.id === expense.category) ?? CATEGORIES[CATEGORIES.length - 1];
                const Icon = cat.icon;
                return (
                  <div
                    key={expense.id}
                    className="group flex items-center justify-between p-5 rounded-3xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-[#D4FF00] group-hover:bg-[#D4FF00]/10 transition-colors">
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-lg tracking-tight mb-1">
                          {expense.note || expense.category}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-mono text-white/40">
                          <span className="uppercase tracking-widest">{expense.category}</span>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span>{new Date(expense.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "2-digit" })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-xl tracking-tight text-white/90">
                        ${expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-3 text-white/20 hover:text-[#ff4d4d] hover:bg-[#ff4d4d]/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Delete expense"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
