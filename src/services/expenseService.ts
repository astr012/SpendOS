import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Expense, NewExpenseInput } from "../types/expense";

/**
 * Returns the Firestore collection reference scoped to the user's expenses.
 * Path: artifacts/{appId}/users/{userId}/expenses
 * Requirements: 6.1, 6.2
 */
function expensesRef(userId: string, appId: string) {
  return collection(db, "artifacts", appId, "users", userId, "expenses");
}

/**
 * Subscribes to real-time updates of the user's expense collection.
 * Requirements: 3.1, 6.1, 6.2
 */
export function subscribeToExpenses(
  userId: string,
  appId: string,
  onData: (expenses: Expense[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    expensesRef(userId, appId),
    (snapshot) => {
      const expenses: Expense[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Expense, "id">),
      }));
      onData(expenses);
    },
    (err) => onError(err)
  );
}

/**
 * Writes a new expense document to Firestore.
 * Requirements: 2.6, 6.1, 6.2, 6.3
 */
export async function addExpense(
  userId: string,
  appId: string,
  data: NewExpenseInput
): Promise<void> {
  await addDoc(expensesRef(userId, appId), {
    userId,
    amount: data.amount,
    category: data.category,
    date: data.date,
    note: data.note,
    createdAt: serverTimestamp(),
  });
}

/**
 * Deletes an expense document by ID.
 * Requirements: 4.1
 */
export async function deleteExpense(
  userId: string,
  appId: string,
  expenseId: string
): Promise<void> {
  await deleteDoc(doc(db, "artifacts", appId, "users", userId, "expenses", expenseId));
}
