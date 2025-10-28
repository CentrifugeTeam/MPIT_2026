import { useMutation } from "@tanstack/react-query";
import { registerUser } from "../api/authApi";
import { useToast } from "@/shared/hooks/useToast";
import { useTranslation } from "react-i18next";
import type { RegisterRequest, RegisterResponse } from "../types/auth.types";

export const useRegister = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation<RegisterResponse, Error, RegisterRequest>({
    mutationFn: registerUser,
    onSuccess: (data) => {
      console.log("Пользователь успешно зарегистрирован:", data);
      toast.success(t("success.auth.register"));
    },
    onError: () => {
      console.error("Ошибка регистрации");
      // Axios interceptor уже покажет детальную ошибку
      toast.error(t("errors.auth.registerFailed"));
    },
  });
};
