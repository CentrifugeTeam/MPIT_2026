import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserRole, getCurrentUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import type { UpdateRoleRequest, TokenResponse } from "../types/auth.types";

interface UpdateRoleVariables {
  userId: string;
  role: UpdateRoleRequest;
}

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { setToken, updateUser, user } = useUserStore();

  return useMutation<TokenResponse, Error, UpdateRoleVariables>({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: async (data, variables) => {
      // Обновляем токен (уже обновлен в interceptor, но на всякий случай)
      setToken(data.access_token);

      // Если обновили роль текущего пользователя, получаем обновленные данные с сервера
      if (user?.uuid === variables.userId) {
        try {
          const userData = await getCurrentUser();
          updateUser({
            role: userData.role,
          });
          console.log("Данные пользователя обновлены:", userData);
        } catch (error) {
          console.error(
            "Ошибка получения обновленных данных пользователя:",
            error
          );
        }
      }

      // Инвалидируем кеш пользователей
      queryClient.invalidateQueries({ queryKey: ["auth", "users"] });
      queryClient.invalidateQueries({
        queryKey: ["auth", "user", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });

      console.log("Роль успешно обновлена:", variables.role);
    },
    onError: (error) => {
      console.error("Ошибка обновления роли:", error);
    },
  });
};
