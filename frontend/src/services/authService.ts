
import { api, TOKEN_STORAGE_KEY } from "../lib/api";
import type {
  TokenResponse,
  UserLogin,
  UserResponse,
} from "../types/auth";

export const authService = {
  async login(credentials: UserLogin): Promise<UserResponse> {
    const response = await api.post<TokenResponse>("/auth/login", {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
    });

    const { access_token, token_type } = response.data;

    if (!access_token || token_type.toLowerCase() !== "bearer") {
      throw new Error("Invalid authentication response from server.");
    }

    sessionStorage.setItem(TOKEN_STORAGE_KEY, access_token);

    try {
      return await this.getCurrentUser();
    } catch (error) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      throw error;
    }
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await api.get<UserResponse>("/auth/me");

    if (!response.data.is_active) {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      throw new Error("Your account is inactive.");
    }

    return response.data;
  },

  logout(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  hasToken(): boolean {
    return Boolean(sessionStorage.getItem(TOKEN_STORAGE_KEY));
  },
};
