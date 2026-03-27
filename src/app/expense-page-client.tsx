"use client";

import { useState, useEffect, useMemo } from "react";
import { Wallet, Loader2, TrendingDown, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { signIn } from "../services/authService";
import { subscribeToExpenses, addExpense, deleteExpense, updateExpense } from "../services/expenseService";
import { Expense } from "../types/expense";
import { formatINR } from "../lib/currency";
import { CATEGORIES } from "../lib/constants";

import ExpenseForm from "../components/expense-form";
import ExpenseStats from "../components/expense-stats";
import ExpenseList from "../components/expense-list";
import EditExpenseModal from "../components/edit-expense-modal";

const appId = process.env.NEXT_PUBLIC_APP_ID ?? "default-app";
const ADD_EXPENSE_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: number | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Request timeout"));
      }, timeoutMs);
      promise.then(resolve).catch(reject);
    });
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

export default function ExpensePageClient() {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({ amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [deleteTimer, setDeleteTimer] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ amount: "", category: "Food", date: "", note: "" });
  const [savingEdit, setSavingEdit] = useState(false);

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
      console.error(err);
      setSubmitError("Could not log transaction. Please check connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || deletingId || pendingDelete) return;
    const target = expenses.find((e) => e.id === id);
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
    if (deleteTimer) window.clearTimeout(deleteTimer);
    setDeleteTimer(null);
    setPendingDelete(null);
    setDeletingId(null);
  };

  const handleStartEdit = (id: string) => {
    const target = expenses.find((e) => e.id === id);
    if (!target) return;
    setEditingId(id);
    setEditData({ amount: String(target.amount), category: target.category, date: target.date, note: target.note ?? "" });
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

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  
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
    return expenses.reduce((sum, e) => {
      const d = new Date(e.date + "T00:00:00");
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) return sum + e.amount;
      return sum;
    }, 0);
  }, [expenses]);

  const avgExpense = useMemo(() => {
    if (!filteredExpenses.length) return 0;
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length;
  }, [filteredExpenses]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4FF00]" />
      </div>
    );
  }

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
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#D4FF00]/5 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[45vw] h-[45vw] bg-[#44b2ff]/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* LEFT PANEL */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full flex flex-col justify-between p-6 md:p-8 relative z-10 h-auto md:h-screen md:sticky md:top-0"
      >
        <header className="flex items-center justify-between mb-6 md:mb-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="font-mono text-xs tracking-[0.2em] text-white/50 uppercase">Session Active</span>
          </div>
          <div className="font-mono text-xs text-white/30 tracking-widest">
            ID: {user.uid.slice(0, 8).toUpperCase()}
          </div>
        </header>

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

        <ExpenseForm 
          formData={formData} 
          setFormData={setFormData}
          onSubmit={handleAddExpense}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </motion.div>

      {/* RIGHT PANEL */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        className="w-full p-6 md:p-8 relative z-10 md:h-screen"
      >
        <div className="h-full bg-white/[0.03] border border-white/10 rounded-2xl backdrop-blur-2xl shadow-2xl md:overflow-hidden flex flex-col">
          <div className="p-6 md:p-8 pt-6 pb-2 border-b border-white/10 shrink-0 bg-black/20">
            <div className="flex justify-between items-end mb-4">
              <h3 className="text-xl font-light tracking-tight text-white/80">Ledger</h3>
              <div className="text-[#D4FF00] text-xs font-mono bg-[#D4FF00]/10 px-3 py-2 rounded-full">
                {filteredExpenses.length} records
              </div>
            </div>
            <ExpenseStats monthlyTotal={monthlyTotal} avgExpense={avgExpense} filteredCount={filteredExpenses.length} />

            <div className="space-y-4 mb-2">
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
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-colors"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.id}</option>)}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#D4FF00] hover:border-white/20 transition-colors"
                >
                  <option value="date-desc">Newest</option>
                  <option value="date-asc">Oldest</option>
                  <option value="amount-desc">Amount High-Low</option>
                  <option value="amount-asc">Amount Low-High</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-8 pt-4 flex-1 overflow-hidden" style={{ minHeight: "400px" }}>
            {loadingData ? (
              <div className="py-20 flex justify-center h-full items-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
              </div>
            ) : (
              <ExpenseList 
                expenses={filteredExpenses} 
                onDelete={handleDelete} 
                onEdit={handleStartEdit} 
                deletingId={deletingId} 
              />
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {pendingDelete && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 bg-black/80 border border-white/15 rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-xl shadow-2xl"
          >
            <span className="text-sm text-white/80">Transaction removed</span>
            <button onClick={handleUndoDelete} className="text-[#D4FF00] text-sm font-semibold hover:opacity-80 hover:underline transition-all">
              Undo
            </button>
          </motion.div>
        )}

        {editingId && (
          <EditExpenseModal
            editData={editData}
            setEditData={setEditData}
            onSave={handleSaveEdit}
            onClose={() => setEditingId(null)}
            savingEdit={savingEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
