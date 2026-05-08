import { useState, useEffect, useCallback } from "react";
import { getStoredUser, clearAuth, type User } from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    const handler = () => setUser(getStoredUser());
    window.addEventListener("auth-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("auth-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, []);

  return { user, isAuthenticated: !!user, logout };
}
