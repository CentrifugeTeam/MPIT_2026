import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCurrentUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import type { UpdateUserRequest, UserResponse } from "../types/auth.types";

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useUserStore();

  return useMutation<UserResponse, Error, UpdateUserRequest>({
    mutationFn: updateCurrentUser,
    onSuccess: (data) => {
      // Обновляем пользователя в store
      updateUser({
        uuid: data.uuid,
        email: data.email,
        role: data.role,
      });

      // Инвалидируем кеш текущего пользователя
      queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });

      console.log("Пользователь успешно обновлен:", data);
    },
    onError: (error) => {
      console.error("Ошибка обновления пользователя:", error);
    },
  });
};
