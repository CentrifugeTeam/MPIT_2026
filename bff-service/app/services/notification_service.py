import httpx
from typing import Dict, Any, List
from app.core.config import get_settings

settings = get_settings()

class NotificationService:
    def __init__(self):
        self.notification_service_url = settings.NOTIFICATION_SERVICE_URL

    async def create_notification(self, user_id: str, notification_data: Dict[str, Any]) -> Dict[str, Any]:
        """Создать уведомление через notification-service"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.notification_service_url}/notifications/{user_id}",
                json=notification_data
            )
            response.raise_for_status()
            return response.json()

    async def get_user_notifications(self, user_id: str) -> List[Dict[str, Any]]:
        """Получить уведомления пользователя через notification-service"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.notification_service_url}/notifications/{user_id}"
            )
            response.raise_for_status()
            return response.json()

    async def send_notification_to_queue(self, user_id: str, notification_data: Dict[str, Any]) -> str:
        """Отправить уведомление в очередь через notification-service"""
        try:
            print(f"BFF: Sending notification to {self.notification_service_url}/notifications/{user_id}/notify")
            print(f"BFF: Notification data: {notification_data}")
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.notification_service_url}/notifications/{user_id}/notify",
                    json=notification_data
                )
                print(f"BFF: Response status: {response.status_code}")
                print(f"BFF: Response text: {response.text}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"BFF: Error in send_notification_to_queue: {str(e)}")
            raise e

    async def get_notification_settings(self, user_id: str) -> Dict[str, Any]:
        """Получить настройки уведомлений через notification-service"""
        try:
            print(f"Trying to connect to notification-service: {self.notification_service_url}/notifications/{user_id}/settings")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.notification_service_url}/notifications/{user_id}/settings"
                )
                print(f"Response status: {response.status_code}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            print(f"Error connecting to notification-service: {str(e)}")
            raise e

    async def update_notification_settings(self, user_id: str, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """Обновить настройки уведомлений через notification-service"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.notification_service_url}/notifications/{user_id}/settings",
                json=settings_data
            )
            response.raise_for_status()
            return response.json()
