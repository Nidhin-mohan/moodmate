import { createContext, useState, useContext, ReactNode } from "react";
import type { User } from "@/types/auth";

// Re-export so existing imports of User from this file keep working.
export type { User };

type AuthContextType = {
  isLoggedIn: boolean;
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Merges a parsed localStorage user with safe defaults so old sessions
// that pre-date the role/isPro fields don't break.
function hydrateUser(raw: unknown): User {
  const base = raw as Partial<User>;
  return {
    role: "user",
    isPro: false,
    ...base,
  } as User;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    try {
      return hydrateUser(JSON.parse(saved));
    } catch {
      return null;
    }
  });

  const isLoggedIn = !!token;

  const login = (userData: User, newToken: string) => {
    const enriched = hydrateUser(userData);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(enriched));
    setToken(newToken);
    setUser(enriched);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
