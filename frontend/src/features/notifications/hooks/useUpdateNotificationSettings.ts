import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateNotificationSettings } from "../api/notificationsApi";
import type {
  NotificationSettingsRequest,
  NotificationSettingsResponse,
} from "../types/notification.types";

interface UpdateSettingsVariables {
  userId: string;
  settings: NotificationSettingsRequest;
}

export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<
    NotificationSettingsResponse,
    Error,
    UpdateSettingsVariables
  >({
    mutationFn: ({ userId, settings }) =>
      updateNotificationSettings(userId, settings),
    onSuccess: (data, variables) => {
      // Инвалидируем кеш настроек уведомлений
      queryClient.invalidateQueries({
        queryKey: ["notifications", "settings", variables.userId],
      });

      console.log("Настройки уведомлений успешно обновлены:", data);
    },
    onError: (error) => {
      console.error("Ошибка обновления настроек уведомлений:", error);
    },
  });
};
