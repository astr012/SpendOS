import { vi } from "vitest";

// Mock Firebase modules so tests never make real network calls
vi.mock("../lib/firebase", () => ({
  app: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
    signInAnonymously: vi.fn(),
    signInWithCustomToken: vi.fn(),
  },
  db: {
    collection: vi.fn(),
    doc: vi.fn(),
  },
}));
