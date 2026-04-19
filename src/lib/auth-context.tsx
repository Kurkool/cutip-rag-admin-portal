"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export interface AdminUser {
  uid: string;
  email: string;
  display_name: string;
  role: "super_admin" | "faculty_admin";
  tenant_ids: string[];
  is_active: boolean;
}

interface AuthState {
  firebaseUser: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

// ──────────────────────────────────────
// Provider
// ──────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch admin profile from backend
  async function fetchAdminProfile(user: User) {
    try {
      const token = await user.getIdToken();
      const apiUrl =
        localStorage.getItem("api_url") ||
        process.env.NEXT_PUBLIC_API_URL ||
        "";
      const res = await fetch(`${apiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 403) {
          setError("Account not authorized. Contact super admin.");
          await firebaseSignOut(getFirebaseAuth());
          return;
        }
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }
      const profile: AdminUser = await res.json();
      setAdminUser(profile);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
      setAdminUser(null);
    }
  }

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      setFirebaseUser(user);
      if (user) {
        await fetchAdminProfile(user);
      } else {
        setAdminUser(null);
        setError(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await fetchAdminProfile(cred.user);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/user-not-found") {
        setError("Invalid email or password");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again later.");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await firebaseSignOut(getFirebaseAuth());
    setAdminUser(null);
    setError(null);
  }

  async function getIdToken(): Promise<string | null> {
    if (!firebaseUser) return null;
    return firebaseUser.getIdToken();
  }

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        adminUser,
        loading,
        error,
        signIn,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ──────────────────────────────────────
// Hook
// ──────────────────────────────────────

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
