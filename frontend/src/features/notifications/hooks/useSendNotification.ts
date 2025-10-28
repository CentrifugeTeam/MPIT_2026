import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendNotificationToQueue } from "../api/notificationsApi";
import type {
  NotificationCreateRequest,
  SendNotificationResponse,
} from "../types/notification.types";

interface SendNotificationVariables {
  userId: string;
  notification: NotificationCreateRequest;
}

export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SendNotificationResponse,
    Error,
    SendNotificationVariables
  >({
    mutationFn: ({ userId, notification }) =>
      sendNotificationToQueue(userId, notification),
    onSuccess: (data, variables) => {
      // Инвалидируем кеш уведомлений пользователя
      queryClient.invalidateQueries({
        queryKey: ["notifications", variables.userId],
      });

      console.log("Уведомление успешно отправлено в очередь:", data);
    },
    onError: (error) => {
      console.error("Ошибка отправки уведомления:", error);
    },
  });
};
