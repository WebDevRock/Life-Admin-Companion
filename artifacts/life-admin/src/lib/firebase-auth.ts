import { useState, useEffect, useCallback } from "react";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

async function syncSession(firebaseUser: FirebaseUser | null): Promise<AuthUser | null> {
  if (!firebaseUser) {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    return null;
  }
  const idToken = await firebaseUser.getIdToken();
  const sessionRes = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!sessionRes.ok) return null;
  const userRes = await fetch("/api/auth/user", { credentials: "include" });
  if (!userRes.ok) return null;
  const data = (await userRes.json()) as { user: AuthUser | null };
  return data.user ?? null;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

export function useFirebaseAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      try {
        const synced = await syncSession(firebaseUser);
        setUser(synced);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsub;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const auth = getAuth(getFirebaseApp());
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = friendlyError(err instanceof Error ? err.message : "");
      setAuthError(msg);
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const auth = getAuth(getFirebaseApp());
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const msg = friendlyError(err instanceof Error ? err.message : "");
      setAuthError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    const auth = getAuth(getFirebaseApp());
    await signOut(auth);
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return { user, isLoading, isAuthenticated: !!user, login, register, logout, authError, clearAuthError };
}

function friendlyError(message: string): string {
  if (message.includes("user-not-found") || message.includes("wrong-password") || message.includes("invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (message.includes("email-already-in-use")) return "An account with this email already exists.";
  if (message.includes("weak-password")) return "Password must be at least 6 characters.";
  if (message.includes("invalid-email")) return "Please enter a valid email address.";
  if (message.includes("too-many-requests")) return "Too many attempts. Please try again later.";
  return "Something went wrong. Please try again.";
}
