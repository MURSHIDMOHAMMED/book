"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Customer, AdminUser, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  profile: Customer | AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getIdToken: () => Promise<string | null>;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<Customer | AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUserRole = useCallback(async (firebaseUser: User) => {
    try {
      // Check admin collection first
      const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid));
      if (adminDoc.exists()) {
        setRole("admin");
        setProfile({ uid: firebaseUser.uid, ...adminDoc.data() } as AdminUser);
        return;
      }

      // Fall back to customer
      const customerDoc = await getDoc(doc(db, "customers", firebaseUser.uid));
      if (customerDoc.exists()) {
        setRole("customer");
        setProfile({ uid: firebaseUser.uid, ...customerDoc.data() } as Customer);
      } else {
        // New user — create customer profile
        const newCustomer: Omit<Customer, "uid"> = {
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "User",
          photoURL: firebaseUser.photoURL ?? undefined,
          role: "customer",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          purchasedBooks: [],
          totalSpent: 0,
          downloadCount: 0,
        };
        await setDoc(doc(db, "customers", firebaseUser.uid), {
          ...newCustomer,
          _createdAt: serverTimestamp(),
        });
        setRole("customer");
        setProfile({ uid: firebaseUser.uid, ...newCustomer });
      }
    } catch (err) {
      console.error("[Auth] Failed to resolve user role:", err);
      setRole(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await resolveUserRole(firebaseUser);
      } else {
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [resolveUserRole]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
    },
    []
  );

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const value: AuthContextType = {
    user,
    role,
    profile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    getIdToken,
    isAdmin: role === "admin",
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
