import { Expense } from "../types/expense";

export function sortExpenses(expenses: Expense[]): Expense[] {
  return expenses.slice().sort((a, b) => {
    if (a.date !== b.date) {
      return a.date < b.date ? 1 : -1;
    }
    return b.createdAt.toMillis() - a.createdAt.toMillis();
  });
}

export function computeTotal(expenses: Expense[]): string {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  return total.toFixed(2);
}
