import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LOCAL_CONFIG } from "@/shared/config/env";

export interface User {
  uuid: string;
  email: string;
  role?: "USER" | "ADMIN";
  name?: string;
  avatar?: string;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  clearAuth: () => void; // Для принудительного выхода при 401
  initializeLocalUser: () => void; // Инициализация локального пользователя
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setToken: (token) =>
        set({
          token,
          // Если токен есть, считаем что пользователь авторизован
          // Если токена нет, сбрасываем авторизацию
          isAuthenticated: token !== null,
        }),

      setRefreshToken: (refreshToken) =>
        set({
          refreshToken,
        }),

      setTokens: (accessToken, refreshToken) =>
        set({
          token: accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      clearAuth: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      initializeLocalUser: () =>
        set({
          user: LOCAL_CONFIG.LOCAL_USER,
          token: LOCAL_CONFIG.HARDCODED_TOKEN,
          refreshToken: LOCAL_CONFIG.HARDCODED_REFRESH_TOKEN,
          isAuthenticated: true,
        }),
    }),
    {
      name: "user-storage", // имя в localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
