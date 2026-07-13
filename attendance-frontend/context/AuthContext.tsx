"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, getUser, getToken, saveAuth, clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";

type AuthContextType = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = getToken();
    const storedUser  = getUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (res.ok) {
        saveAuth(json.token, json.user);
        setToken(json.token);
        setUser(json.user);
        return null; // no error
      } else {
        return json.message ?? "Login failed.";
      }
    } catch {
      return "Could not connect to the server.";
    }
  }

  async function logout() {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method:  "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch {
      // silently fail
    }
    clearAuth();
    setToken(null);
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}