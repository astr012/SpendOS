import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { collection, addDoc, deleteDoc, doc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { subscribeToExpenses, addExpense, deleteExpense } from "./expenseService";
import { CATEGORIES } from "../types/expense";

// Feature: dark-expense-tracker, Property 5: Expense write contains all required fields
// Feature: dark-expense-tracker, Property 8: Delete targets the correct document
// Feature: dark-expense-tracker, Property 11: Firestore path is correctly scoped
vi.mock("../lib/firebase", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
}));

const mockCollectionRef = { id: "mock-collection" };
const mockDocRef = { id: "mock-doc" };

describe("expenseService — Property 11: Firestore path is correctly scoped", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollectionRef);
    (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
    (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-doc" });
    (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (onSnapshot as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
  });

  it("Property 11: subscribeToExpenses uses path artifacts/{appId}/users/{userId}/expenses — Validates: Requirements 6.1, 6.2", () => {
    // Invariant: for any appId and userId, collection() is called with the exact scoped path
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (appId, userId) => {
          vi.clearAllMocks();
          (collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollectionRef);
          (onSnapshot as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());

          subscribeToExpenses(userId, appId, vi.fn(), vi.fn());

          expect(collection).toHaveBeenCalledWith(
            expect.anything(),
            "artifacts",
            appId,
            "users",
            userId,
            "expenses"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 11: addExpense uses path artifacts/{appId}/users/{userId}/expenses — Validates: Requirements 6.1, 6.2", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (appId, userId) => {
          vi.clearAllMocks();
          (collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollectionRef);
          (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-doc" });

          await addExpense(userId, appId, {
            amount: 10,
            category: "Food",
            date: "2024-01-01",
            note: "",
          });

          expect(collection).toHaveBeenCalledWith(
            expect.anything(),
            "artifacts",
            appId,
            "users",
            userId,
            "expenses"
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 11: deleteExpense uses path artifacts/{appId}/users/{userId}/expenses/{expenseId} — Validates: Requirements 6.1, 6.2", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        async (appId, userId, expenseId) => {
          vi.clearAllMocks();
          (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
          (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

          await deleteExpense(userId, appId, expenseId);

          expect(doc).toHaveBeenCalledWith(
            expect.anything(),
            "artifacts",
            appId,
            "users",
            userId,
            "expenses",
            expenseId
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("expenseService — Property 8: Delete targets the correct document", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
    (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("Property 8: deleteExpense calls deleteDoc with the exact expenseId and no other — Validates: Requirements 4.1", async () => {
    // Invariant: for any expense row, activating delete should invoke deleteExpense with
    // exactly that expense's id — never a different id, never called more than once.
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),  // userId
        fc.string({ minLength: 1 }),  // appId
        fc.string({ minLength: 1 }),  // expenseId to delete
        fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }), // other expense ids
        async (userId, appId, targetId, otherIds) => {
          vi.clearAllMocks();
          (doc as ReturnType<typeof vi.fn>).mockReturnValue(mockDocRef);
          (deleteDoc as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

          await deleteExpense(userId, appId, targetId);

          // deleteDoc must be called exactly once
          expect(deleteDoc).toHaveBeenCalledTimes(1);

          // doc() must be called with the target expenseId in the path
          expect(doc).toHaveBeenCalledWith(
            expect.anything(),
            "artifacts",
            appId,
            "users",
            userId,
            "expenses",
            targetId
          );

          // None of the other ids should appear in any doc() call
          const docCalls = (doc as ReturnType<typeof vi.fn>).mock.calls;
          for (const otherId of otherIds) {
            if (otherId === targetId) continue; // skip coincidental matches
            for (const callArgs of docCalls) {
              expect(callArgs).not.toContain(otherId);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("expenseService — Property 5: Expense write contains all required fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollectionRef);
    (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-doc" });
    (serverTimestamp as ReturnType<typeof vi.fn>).mockReturnValue("SERVER_TIMESTAMP");
  });

  it("Property 5: addExpense writes exactly the required fields with userId === auth.uid — Validates: Requirements 2.6, 6.3", async () => {
    // Invariant: for any valid form submission by an authenticated user, the document written
    // to Firestore must contain exactly: userId, amount, category, date, note, createdAt,
    // where userId equals the authenticated user's uid.
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),  // userId (auth.uid)
        fc.string({ minLength: 1 }),  // appId
        fc.record({
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1_000_000), noNaN: true }),
          category: fc.constantFrom(...CATEGORIES),
          date: fc.date({ min: new Date("2000-01-01"), max: new Date("2099-12-31") }).map(
            (d) => d.toISOString().slice(0, 10)
          ),
          note: fc.string(),
        }),
        async (userId, appId, input) => {
          vi.clearAllMocks();
          (collection as ReturnType<typeof vi.fn>).mockReturnValue(mockCollectionRef);
          (addDoc as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-doc" });
          (serverTimestamp as ReturnType<typeof vi.fn>).mockReturnValue("SERVER_TIMESTAMP");

          await addExpense(userId, appId, input);

          expect(addDoc).toHaveBeenCalledTimes(1);

          const writtenData = (addDoc as ReturnType<typeof vi.fn>).mock.calls[0][1];

          // Must contain exactly the six required fields
          const requiredFields = ["userId", "amount", "category", "date", "note", "createdAt"];
          expect(Object.keys(writtenData).sort()).toEqual(requiredFields.sort());

          // userId must equal the authenticated user's uid
          expect(writtenData.userId).toBe(userId);

          // Remaining fields must match the input
          expect(writtenData.amount).toBe(input.amount);
          expect(writtenData.category).toBe(input.category);
          expect(writtenData.date).toBe(input.date);
          expect(writtenData.note).toBe(input.note);

          // createdAt must be the server timestamp sentinel
          expect(writtenData.createdAt).toBe("SERVER_TIMESTAMP");
        }
      ),
      { numRuns: 100 }
    );
  });
});
