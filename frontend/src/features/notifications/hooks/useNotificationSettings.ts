import { useQuery } from "@tanstack/react-query";
import { getNotificationSettings } from "../api/notificationsApi";
import { useUserStore } from "@/store/userStore";
import type { NotificationSettingsResponse } from "../types/notification.types";

export const useNotificationSettings = (userId?: string, enabled = true) => {
  const { user } = useUserStore();

  // Используем переданный userId или берем из store
  const targetUserId = userId || user?.uuid;

  return useQuery<NotificationSettingsResponse, Error>({
    queryKey: ["notifications", "settings", targetUserId],
    queryFn: () => getNotificationSettings(targetUserId!),
    enabled: enabled && !!targetUserId, // Запрос только если есть userId
  });
};
