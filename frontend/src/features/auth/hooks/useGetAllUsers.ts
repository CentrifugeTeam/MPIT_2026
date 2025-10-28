import { useQuery } from "@tanstack/react-query";
import { getAllUsers } from "../api/authApi";
import type { UserListResponse } from "../types/auth.types";

export const useGetAllUsers = (enabled = true) => {
  return useQuery<UserListResponse, Error>({
    queryKey: ["auth", "users"],
    queryFn: getAllUsers,
    enabled, // Может быть disabled если пользователь не ADMIN
  });
};
