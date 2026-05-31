"use client";

import { useEffect, useState, useCallback } from "react";
import { clientStorage } from "@/lib/clientStorage";
import { LocalStore, SyncQueue } from "@/lib/offline";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  userId: string;
  email: string;
  isAdmin?: boolean;
  username?: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/me");

      if (response.ok) {
        const data = await response.json();
        setUser({
          userId: data.userId,
          email: data.email,
          isAdmin: data.isAdmin,
          username: data.username,
        });
        setError(null);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("Auth check failed:", err);
      setUser(null);
      setError("Failed to check authentication");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount and on route changes so shared layout components (e.g. NavBar)
  // see updated auth state after client-side login/register navigation.
  useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  // Register function
  const register = useCallback(async (email: string, password: string, username: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setUser({ userId: data.userId, email: data.email, username: data.username });
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      console.error("[Auth Hook] Registration error:", message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser({ userId: data.userId, email: data.email, username: data.username });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    const safeCleanup = (label: string, cleanup: () => void) => {
      try {
        cleanup();
      } catch (cleanupErr) {
        console.warn(`Failed logout cleanup step: ${label}`, cleanupErr);
      }
    };

    try {
      setLoading(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        console.warn("Logout endpoint returned non-OK status");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Always clear browser-side session data, even if network logout fails.
      safeCleanup("LocalStore.clear", () => LocalStore.clear());
      safeCleanup("SyncQueue.clear", () => SyncQueue.clear());
      safeCleanup("clientStorage.clear", () => clientStorage.clear());

      setUser(null);
      setError(null);
      console.debug("[auth] logout completed");
      router.replace("/login");
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
