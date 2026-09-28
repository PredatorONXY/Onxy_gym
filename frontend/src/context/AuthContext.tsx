"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch, setAuthToken } from "@/lib/api";

import { useRouter } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: "ADMIN" | "USER";
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (fullName: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await apiFetch<AuthUser>("/auth/me");
      setUser(currentUser);
      return currentUser;
    } catch {
      setAuthToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        refreshUser();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const data = await apiFetch<{ accessToken: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setAuthToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
  ): Promise<AuthUser> => {
    const data = await apiFetch<{ accessToken: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    });

    setAuthToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout errors
    } finally {
      setAuthToken(null);
      setUser(null);
      router.replace("/auth/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
