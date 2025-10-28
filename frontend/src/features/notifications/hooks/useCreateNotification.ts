import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotification } from "../api/notificationsApi";
import type {
  NotificationCreateRequest,
  NotificationResponse,
} from "../types/notification.types";

interface CreateNotificationVariables {
  userId: string;
  notification: NotificationCreateRequest;
}

export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<NotificationResponse, Error, CreateNotificationVariables>({
    mutationFn: ({ userId, notification }) =>
      createNotification(userId, notification),
    onSuccess: (data, variables) => {
      // Инвалидируем кеш уведомлений пользователя
      queryClient.invalidateQueries({
        queryKey: ["notifications", variables.userId],
      });

      console.log("Уведомление успешно создано:", data);
    },
    onError: (error) => {
      console.error("Ошибка создания уведомления:", error);
    },
  });
};
