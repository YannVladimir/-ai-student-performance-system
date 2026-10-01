import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LoginResponse, Role } from "../types";
import { login as apiLogin } from "../api/auth";

interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("aisps_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<AuthUser> {
    const response: LoginResponse = await apiLogin(email, password);
    const authUser: AuthUser = {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    };
    localStorage.setItem("aisps_token", response.token);
    localStorage.setItem("aisps_user", JSON.stringify(authUser));
    setUser(authUser);
    return authUser;
  }

  function logout() {
    localStorage.removeItem("aisps_token");
    localStorage.removeItem("aisps_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
