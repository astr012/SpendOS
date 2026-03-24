import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { signIn } from "./authService";

// Feature: dark-expense-tracker, Property 1: Auth method selection
vi.mock("../lib/firebase", () => ({
  app: {},
  auth: {},
  db: {},
}));

vi.mock("firebase/auth", () => ({
  signInAnonymously: vi.fn(),
  signInWithCustomToken: vi.fn(),
}));

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (signInAnonymously as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { uid: "anon" } });
    (signInWithCustomToken as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { uid: "custom" } });
  });

  // Feature: dark-expense-tracker, Property 2: User identity stored after auth
  it("Property 2: User identity stored after auth — Validates: Requirements 1.2", async () => {
    // Round-trip: for any user object returned by Firebase Auth, signIn() returns that exact user
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          uid: fc.string({ minLength: 1 }),
          isAnonymous: fc.boolean(),
          displayName: fc.option(fc.string(), { nil: null }),
          email: fc.option(fc.emailAddress(), { nil: null }),
        }),
        async (user) => {
          vi.clearAllMocks();
          const credential = { user };
          (signInAnonymously as ReturnType<typeof vi.fn>).mockResolvedValue(credential);
          (signInWithCustomToken as ReturnType<typeof vi.fn>).mockResolvedValue(credential);

          delete (window as Window & { __initial_auth_token?: string }).__initial_auth_token;

          const result = await signIn();

          expect(result.user).toEqual(user);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("Property 1: Auth method selection — Validates: Requirements 1.1", async () => {
    // Metamorphic: for any token state, exactly the correct auth method is called
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1 }),  // defined token → signInWithCustomToken
          fc.constant(undefined)         // undefined token → signInAnonymously
        ),
        async (token) => {
          vi.clearAllMocks();
          (signInAnonymously as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { uid: "anon" } });
          (signInWithCustomToken as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { uid: "custom" } });

          if (token !== undefined) {
            (window as Window & { __initial_auth_token?: string }).__initial_auth_token = token;
          } else {
            delete (window as Window & { __initial_auth_token?: string }).__initial_auth_token;
          }

          await signIn();

          if (token !== undefined) {
            expect(signInWithCustomToken).toHaveBeenCalledTimes(1);
            expect(signInAnonymously).not.toHaveBeenCalled();
          } else {
            expect(signInAnonymously).toHaveBeenCalledTimes(1);
            expect(signInWithCustomToken).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
