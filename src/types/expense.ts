import { Timestamp } from "firebase/firestore";
import { User } from "firebase/auth";

export interface Expense {
  id: string;           // Firestore document ID (client-side only)
  userId: string;       // auth.uid
  amount: number;       // positive float
  category: string;     // one of CATEGORIES
  date: string;         // ISO date string "YYYY-MM-DD"
  note: string;         // free text, may be empty
  createdAt: Timestamp; // Firestore server timestamp
}

export interface NewExpenseInput {
  amount: number;
  category: string;
  date: string;
  note: string;
}

export interface AppState {
  authState: "loading" | "authenticated" | "error";
  user: User | null;
  expenses: Expense[];
  dataLoading: boolean;
  formSubmitting: boolean;
  error: string | null;
}

export interface FormErrors {
  amount?: string;
  date?: string;
}

export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

export type Category = typeof CATEGORIES[number];
