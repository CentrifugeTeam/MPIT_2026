// Типы для запросов
export interface NotificationCreateRequest {
  title: string;
  message: string;
  type: "registration" | "system" | "email";
}

export interface NotificationSettingsRequest {
  email_notifications?: boolean;
  system_notifications?: boolean;
  registration_notifications?: boolean;
}

// Типы для ответов
export interface NotificationResponse {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "registration" | "system" | "email";
  status: "pending" | "sent" | "failed";
  created_at: string;
  sent_at?: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
}

export interface NotificationSettingsResponse {
  user_id: string;
  email_notifications: boolean;
  system_notifications: boolean;
  registration_notifications: boolean;
  updated_at: string;
}

export interface SendNotificationResponse {
  message: string;
  notification_id: string;
}
