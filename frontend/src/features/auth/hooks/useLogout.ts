import { useUserStore } from "@/store/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/useToast";
import { useTranslation } from "react-i18next";

export const useLogout = () => {
  const { logout } = useUserStore();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return () => {
    try {
      // Очищаем store
      logout();

      // Очищаем весь кеш React Query
      queryClient.clear();

      console.log("Пользователь вышел из системы");
      toast.success(t("success.auth.logout"));
    } catch (error) {
      console.error("Ошибка выхода:", error);
      toast.error(t("errors.auth.logoutFailed"));
    }
  };
};
