import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api/authApi";
import type { UserResponse } from "../types/auth.types";

export const useGetUserById = (userId: string, enabled = true) => {
  return useQuery<UserResponse, Error>({
    queryKey: ["auth", "user", userId],
    queryFn: () => getUserById(userId),
    enabled: enabled && !!userId, // Запрос выполняется только если userId существует и enabled = true
  });
};
