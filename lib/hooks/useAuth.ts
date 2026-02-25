"use client";

import { useEffect, useState, useCallback } from "react";
import { clientStorage } from "@/lib/clientStorage";
import { useRouter } from "next/navigation";

const SESSION_COMBAT_PREFIX = "sessionCombat:v1:";

export interface AuthUser {
  userId: string;
  email: string;
  isAdmin?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Register function
  const register = useCallback(async (email: string, password: string) => {
    console.log("[Auth Hook] Register initiated for email:", email);
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log("[Auth Hook] Register API response status:", response.status);

      const data = await response.json();
      console.log("[Auth Hook] Register API response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setUser({ userId: data.userId, email: data.email });
      console.log("[Auth Hook] User state updated, returning true.");
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      console.error("[Auth Hook] Registration error:", message);
      setError(message);
      return false;
    } finally {
      console.log(
        "[Auth Hook] Register function finished, setting loading to false.",
      );
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

      setUser({ userId: data.userId, email: data.email });
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
    try {
      setLoading(true);
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) {
        console.warn("Logout endpoint returned non-OK status");
      }

      // Client-side cleanup: clear clientStorage and any sessionCombat:v1:* localStorage keys
      try {
        clientStorage.clear();
      } catch (cleanupErr) {
        console.warn("clientStorage.clear failed:", cleanupErr);
      }

      try {
        // Defensively clear any localStorage keys that start with the application prefix
        Object.keys(localStorage)
          .filter((key) => key.startsWith(SESSION_COMBAT_PREFIX))
          .forEach((key) => localStorage.removeItem(key));
      } catch (cleanupErr) {
        console.warn(
          "Failed to clear sessionCombat localStorage keys:",
          cleanupErr,
        );
      }

      setUser(null);
      setError(null);
      console.debug("[auth] logout completed");

      // Redirect to login using router.replace to prevent back button access
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed");
    } finally {
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
