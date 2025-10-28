import httpx
from typing import List, Dict, Any
from app.core.config import get_settings

settings = get_settings()

class FilesClient:
    """HTTP клиент для общения с files-service"""

    def __init__(self):
        self.files_service_url = settings.FILES_SERVICE_URL
        self.timeout = 10.0

    async def get_project_files(self, project_id: str) -> List[Dict[str, Any]]:
        """Получить все файлы проекта"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.files_service_url}/files/project/{project_id}"
                )
                if response.status_code == 200:
                    data = response.json()
                    return data.get("files", [])
                return []
        except Exception as e:
            print(f"Error getting project files: {e}")
            return []

    async def get_project_total_size(self, project_id: str) -> int:
        """Получить размер VM_TEMPLATE файла проекта"""
        try:
            files = await self.get_project_files(project_id)
            # Ищем VM_TEMPLATE файл
            vm_file = next((f for f in files if f.get("file_type") == "VM_TEMPLATE"), None)
            return vm_file.get("file_size", 0) if vm_file else 0
        except Exception as e:
            print(f"Error getting project files size: {e}")
            return 0

    async def delete_file(self, file_id: str) -> bool:
        """Удалить файл"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.files_service_url}/files/{file_id}"
                )
                return response.status_code == 204
        except Exception as e:
            print(f"Error deleting file {file_id}: {e}")
            return False

