import { createContext, useState, useContext, ReactNode, useEffect } from "react";

// 1. Define the User Shape based on your JSON response
export type User = {
  userId: string;
  name: string;
  email: string;
  _id: string;
  role?: string;
};

type AuthContextType = {
  isLoggedIn: boolean;
  user: User | null; // User can be null if not logged in
  login: (userData: User, token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 2. Initialize State from LocalStorage
  // This ensures user data persists when the page is refreshed
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isLoggedIn = !!token;

  // 3. Updated Login Function
  const login = (userData: User, newToken: string) => {
    // Save to LocalStorage
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(userData));

    // Update State
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    // Clear LocalStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Clear State
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