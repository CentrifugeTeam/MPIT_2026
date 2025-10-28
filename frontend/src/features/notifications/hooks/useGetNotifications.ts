import { useQuery } from "@tanstack/react-query";
import { getUserNotifications } from "../api/notificationsApi";
import { useUserStore } from "@/store/userStore";
import type { NotificationListResponse } from "../types/notification.types";

export const useGetNotifications = (userId?: string, enabled = true) => {
  const { user } = useUserStore();

  // Используем переданный userId или берем из store
  const targetUserId = userId || user?.uuid;

  return useQuery<NotificationListResponse, Error>({
    queryKey: ["notifications", targetUserId],
    queryFn: () => getUserNotifications(targetUserId!),
    enabled: enabled && !!targetUserId, // Запрос только если есть userId
  });
};
