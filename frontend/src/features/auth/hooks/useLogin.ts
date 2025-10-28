import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser, getCurrentUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/shared/hooks/useToast";
import { useTranslation } from "react-i18next";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const useLogin = () => {
  const { setTokens, setUser } = useUserStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      // Выполняем логин
      const loginData = await loginUser(credentials);

      // Сохраняем оба токена
      setTokens(loginData.access_token, loginData.refresh_token);

      try {
        // Делаем запрос для получения данных пользователя
        const userData = await getCurrentUser();

        // Сохраняем пользователя в store
        setUser(userData);

        console.log("Пользователь успешно вошел в систему:", userData);
        console.log("🔑 Токены сохранены (access + refresh)");

        return loginData;
      } catch (error) {
        console.error("Ошибка получения данных пользователя:", error);
        // Откатываем токены в случае ошибки
        setTokens("", "");
        throw error;
      }
    },
    onSuccess: () => {
      // Показываем успешное уведомление
      toast.success(t("success.auth.login"));

      // Инвалидируем кеш для обновления всех зависимых запросов
      queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });
    },
    onError: () => {
      // Axios interceptor уже покажет детальную ошибку
      // Дополнительно показываем общее уведомление
      toast.error(t("errors.auth.loginFailed"));
    },
  });
};
