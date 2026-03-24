import { signInAnonymously, signInWithCustomToken, UserCredential } from "firebase/auth";
import { auth } from "../lib/firebase";

declare global {
  interface Window {
    __initial_auth_token?: string;
  }
}

/**
 * Signs in the user using a custom token if `window.__initial_auth_token` is defined,
 * otherwise falls back to anonymous sign-in.
 * Requirements: 1.1, 1.2, 1.3
 */
export async function signIn(): Promise<UserCredential> {
  const token = typeof window !== "undefined" ? window.__initial_auth_token : undefined;
  if (token) {
    return signInWithCustomToken(auth, token);
  }
  return signInAnonymously(auth);
}
