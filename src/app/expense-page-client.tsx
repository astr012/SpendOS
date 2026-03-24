"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Wallet, Loader2, Coffee, Car, Zap, Tv,
  ShoppingBag, Package, ArrowUpRight, TrendingDown, Search, X, Check,
} from "lucide-react";
import { signIn } from "../services/authService";
import { subscribeToExpenses, addExpense, deleteExpense, updateExpense } from "../services/expenseService";
import { Expense } from "../types/expense";
import { formatINR } from "../lib/currency";
import CategoryPill from "../components/category-pill";
import ExpenseItem from "../components/expense-item";

const appId = process.env.NEXT_PUBLIC_APP_ID ?? "default-app";
const ADD_EXPENSE_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timeout"));
      }, timeoutMs);

      promise
        .then(resolve)
        .catch(reject);
    });
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: "", category: "Food", date: "", note: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await withTimeout(
        addExpense(user.uid, appId, {
          amount: parseFloat(formData.amount),
          category: formData.category,
          date: formData.date,
          note: formData.note,
        }),
        ADD_EXPENSE_TIMEOUT_MS
      );
      setFormData((p) => ({ ...p, amount: "", note: "" }));
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error("Failed to log transaction");
      }
      setSubmitError("Could not log transaction. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || deletingId || pendingDelete) return;
    const target = expenses.find((expense) => expense.id === id);
    if (!target) return;
    setDeletingId(id);
    setPendingDelete(target);
    const timer = window.setTimeout(async () => {
      try { await deleteExpense(user.uid, appId, id); }
      catch (err) { console.error(err); }
      finally {
        setDeletingId(null);
        setPendingDelete(null);
        setDeleteTimer(null);
      }
    }, 3500);
    setDeleteTimer(timer);
  };

  const handleUndoDelete = () => {
    if (deleteTimer) {
      window.clearTimeout(deleteTimer);
    }
    setDeleteTimer(null);
    setPendingDelete(null);
    setDeletingId(null);
  };

  const handleStartEdit = (id: string) => {
    const target = expenses.find((expense) => expense.id === id);
    if (!target) return;
    setEditingId(id);
    setEditData({
      amount: String(target.amount),
      category: target.category,
      date: target.date,
      note: target.note ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!user || !editingId) return;
    if (!editData.amount || Number(editData.amount) <= 0 || Number.isNaN(Number(editData.amount))) return;
    setSavingEdit(true);
    try {
      await updateExpense(user.uid, appId, editingId, {
        amount: Number(editData.amount),
        category: editData.category,
        date: editData.date,
        note: editData.note,
      });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses]
  );
  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return expenses
      .filter((expense) => {
        const categoryOk = categoryFilter === "All" || expense.category === categoryFilter;
        const queryOk = !q || expense.note.toLowerCase().includes(q) || expense.category.toLowerCase().includes(q);
        return categoryOk && queryOk;
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return b.date.localeCompare(a.date);
        if (sortBy === "date-asc") return a.date.localeCompare(b.date);
        if (sortBy === "amount-desc") return b.amount - a.amount;
        return a.amount - b.amount;
      });
  }, [expenses, searchQuery, categoryFilter, sortBy]);
  const monthlyTotal = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return expenses.reduce((sum, expense) => {
      const d = new Date(expense.date + "T00:00:00");
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return sum + expense.amount;
      }
      return sum;
    }, 0);
  }, [expenses]);
  const avgExpense = useMemo(() => {
    if (!filteredExpenses.length) return 0;
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0) / filteredExpenses.length;
  }, [filteredExpenses]);
  const isInvalidAmount = !formData.amount || Number(formData.amount) <= 0 || Number.isNaN(Number(formData.amount));
  const isSubmitDisabled = isSubmitting || isInvalidAmount || !formData.date;

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
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#D4FF00] selection:text-black grid md:grid-cols-2 overflow-hidden relative">

      {/* Ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#D4FF00]/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] bg-[#44b2ff]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* ── LEFT PANEL ── */}
      <div className="w-full flex flex-col justify-between p-6 md:p-8 relative z-10 h-auto md:h-screen md:sticky md:top-0">

        {/* Header */}
        <header className="flex items-center justify-between mb-6 md:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase">Session Active</span>
          </div>
          <div className="font-mono text-xs text-white/30 tracking-widest">
            ID: {user.uid.slice(0, 8).toUpperCase()}
          </div>
        </header>

        {/* Hero total */}
        <div className="mt-6 md:mt-0">
          <div className="flex items-center gap-2 text-white/50 mb-3">
            <TrendingDown size={14} className="text-[#D4FF00]" />
            <h2 className="text-xs font-mono uppercase tracking-[0.15em]">Net Outflow</h2>
          </div>
          <h1 className="text-[12vw] sm:text-[10vw] md:text-[7vw] leading-none font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/30">
            {formatINR(totalExpenses)}
          </h1>
          <p className="text-white/40 text-xs md:text-sm mt-4 leading-relaxed">
            Track daily spending with fast add, edit, search, and category insights.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleAddExpense}
          className="mt-8 md:mt-auto space-y-6 bg-white/[0.03] border border-white/10 p-6 md:p-8 rounded-2xl backdrop-blur-2xl shadow-2xl hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
        >
          {/* Amount */}
          <div className="relative group">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl md:text-5xl text-white/20 font-light transition-colors group-focus-within:text-[#D4FF00]">
              ₹
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
              className="date-input-dark bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white/70 font-mono text-xs outline-none focus:border-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00]/20 hover:border-white/20 w-full sm:w-2/5"
            />
            <input
              type="text"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Add a note..."
              className="bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00]/20 hover:border-white/20 w-full sm:w-3/5 placeholder:text-white/30"
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
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full p-6 md:p-8 relative z-10 md:h-screen">
        <div className="h-full bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-2xl shadow-2xl hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 h-12 bg-gradient-to-b from-[#0b0b0b] to-transparent z-20 pointer-events-none rounded-t-2xl" />
        <div className="p-6 md:p-8 pt-0">

          {/* Ledger header */}
          <div className="flex justify-between items-end mb-6 border-b border-white/10 pb-4">
            <h3 className="text-xl font-light tracking-tight text-white/80">Ledger</h3>
            <div className="text-[#D4FF00] text-xs font-mono bg-[#D4FF00]/10 px-3 py-2 rounded-full">
              {filteredExpenses.length} records
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
              <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">This Month</p>
              <p className="text-sm font-semibold">{formatINR(monthlyTotal)}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
              <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">Average</p>
              <p className="text-sm font-semibold">{formatINR(avgExpense)}</p>
            </div>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:border-white/20 transition-all">
              <p className="text-[10px] text-white/50 font-mono uppercase tracking-wider mb-2">Filtered</p>
              <p className="text-sm font-semibold">{filteredExpenses.length}</p>
            </div>
          </div>

          <div className="space-y-4 mb-6 bg-white/[0.03] border border-white/10 rounded-2xl p-4 sticky top-4 z-30 backdrop-blur-md">
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes or category"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#D4FF00] focus:ring-2 focus:ring-[#D4FF00]/20 hover:border-white/20 transition-colors"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-colors"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date-desc" | "date-asc" | "amount-desc" | "amount-asc")}
                aria-label="Sort transactions"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-colors"
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="amount-desc">Amount High-Low</option>
                <option value="amount-asc">Amount Low-High</option>
              </select>
            </div>
          </div>

          {loadingData ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-20 text-center text-white/30 bg-white/[0.03] border border-dashed border-white/15 rounded-2xl">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-mono text-sm tracking-widest uppercase">No matching transactions</p>
              <p className="text-xs mt-2 text-white/40">Try changing filters or search keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const cat = CATEGORIES.find((c) => c.id === expense.category) ?? CATEGORIES[CATEGORIES.length - 1];
                const Icon = cat.icon;
                return (
                  <div
                    key={expense.id}
                    className="animate-fade-in"
                  >
                    <ExpenseItem
                      expense={expense}
                      icon={Icon}
                      onDelete={handleDelete}
                      onEdit={handleStartEdit}
                      isDeleting={deletingId === expense.id}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      </div>

      {pendingDelete && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/80 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
          <span className="text-sm text-white/80">
            Transaction removed
          </span>
          <button
            onClick={handleUndoDelete}
            className="text-[#D4FF00] text-sm font-semibold hover:opacity-80 hover:underline transition-all"
          >
            Undo
          </button>
        </div>
      )}

      {editingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0b0b0b] border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Edit Transaction</h4>
              <button onClick={() => setEditingId(null)} aria-label="Close edit dialog" className="p-2 rounded-xl hover:bg-white/10 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20"
              placeholder="Amount"
            />
            <div className="flex gap-4">
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                aria-label="Edit category"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.id}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                aria-label="Edit date"
                className="date-input-dark flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4FF00] hover:border-white/20"
              />
            </div>
            <input
              type="text"
              value={editData.note}
              onChange={(e) => setEditData({ ...editData, note: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#D4FF00] hover:border-white/20"
              placeholder="Note"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit || !editData.amount || Number(editData.amount) <= 0 || Number.isNaN(Number(editData.amount))}
                className="px-4 py-2 rounded-xl bg-[#D4FF00] text-black font-semibold hover:opacity-90 hover:shadow-[0_0_20px_rgba(212,255,0,0.35)] transition-all disabled:opacity-50 inline-flex items-center gap-2"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
