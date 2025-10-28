import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { getCurrentUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import type { UserResponse } from "../types/auth.types";

export const useCurrentUser = () => {
  const { isAuthenticated, setUser } = useUserStore();

  const query = useQuery<UserResponse, Error>({
    queryKey: ["auth", "currentUser"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated, // Запрос выполняется только если пользователь авторизован
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
