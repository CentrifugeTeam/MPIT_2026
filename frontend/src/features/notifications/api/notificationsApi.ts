import apiClient from "@/shared/api/axios";
import type {
  NotificationCreateRequest,
  NotificationResponse,
  NotificationListResponse,
  NotificationSettingsRequest,
  NotificationSettingsResponse,
  SendNotificationResponse,
} from "../types/notification.types";

const NOTIFICATIONS_BASE_URL = "/notification";

/**
 * Создать уведомление для пользователя
 */
export const createNotification = async (
  userId: string,
  data: NotificationCreateRequest
): Promise<NotificationResponse> => {
  const response = await apiClient.post<NotificationResponse>(
    `${NOTIFICATIONS_BASE_URL}/${userId}`,
    data
  );
  return response.data;
};

/**
 * Получить все уведомления пользователя
 */
export const getUserNotifications = async (
  userId: string
): Promise<NotificationListResponse> => {
  const response = await apiClient.get<NotificationListResponse>(
    `${NOTIFICATIONS_BASE_URL}/${userId}`
  );
  return response.data;
};

/**
 * Отправить уведомление в очередь RabbitMQ (с отправкой email)
 */
export const sendNotificationToQueue = async (
  userId: string,
  data: NotificationCreateRequest
): Promise<SendNotificationResponse> => {
  const response = await apiClient.post<SendNotificationResponse>(
    `${NOTIFICATIONS_BASE_URL}/${userId}/notify`,
    data
  );
  return response.data;
};

/**
 * Получить настройки уведомлений пользователя
 */
export const getNotificationSettings = async (
  userId: string
): Promise<NotificationSettingsResponse> => {
  const response = await apiClient.get<NotificationSettingsResponse>(
    `${NOTIFICATIONS_BASE_URL}/${userId}/settings`
  );
  return response.data;
};

/**
 * Обновить настройки уведомлений пользователя
 */
export const updateNotificationSettings = async (
  userId: string,
  data: NotificationSettingsRequest
): Promise<NotificationSettingsResponse> => {
  const response = await apiClient.post<NotificationSettingsResponse>(
    `${NOTIFICATIONS_BASE_URL}/${userId}/settings`,
    data
  );
  return response.data;
};
