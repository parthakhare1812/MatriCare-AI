
import { createContext } from "react";
import type { UserLogin, UserResponse } from "../types/auth";

export interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: UserLogin) => Promise<UserResponse>;
  logout: () => void;
  refreshUser: () => Promise<UserResponse | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
