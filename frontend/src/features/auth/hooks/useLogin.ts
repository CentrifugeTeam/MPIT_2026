import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginUser } from "../api/authApi";
import { useUserStore } from "@/store/userStore";
import { useToast } from "@/shared/hooks/useToast";
import { useTranslation } from "react-i18next";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const useLogin = () => {
  const { setTokens } = useUserStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: async (credentials: LoginRequest) => {
      // Выполняем только один запрос - логин
      const loginData = await loginUser(credentials);
      return loginData;
    },
    onSuccess: (loginData) => {
      // Сохраняем токены ТОЛЬКО при успешном логине
      setTokens(loginData.access_token, loginData.refresh_token);

      console.log("🔑 Токены сохранены (access + refresh)");

      // Показываем успешное уведомление
      toast.success(t("success.auth.login"));

      // Инвалидируем кеш для обновления всех зависимых запросов
      queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });
    },
    // onError убран - axios interceptor покажет детальную ошибку
  });
};
