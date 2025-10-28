import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import { isLocalMode } from "@/shared/config/env";
import type { UserResponse } from "../types/auth.types";

export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useUserStore();

  const query = useQuery<UserResponse, Error>({
    queryKey: ["auth", "currentUser"],
    queryFn: getCurrentUser,
    // Запрос выполняется только если пользователь авторизован И не в локальном режиме
    // В локальном режиме пользователь уже инициализирован в main.tsx
    enabled: isAuthenticated && !isLocalMode,
  });

  useEffect(() => {
    if (query.data) {
      setUser({
        uuid: query.data.uuid,
        email: query.data.email,
        role: query.data.role,
      });
    }
  }, [query.data, setUser]);

  return query;
};
