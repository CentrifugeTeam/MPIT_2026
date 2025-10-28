import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException, status, UploadFile
from app.core.config import get_settings

settings = get_settings()

class FilesService:
    def __init__(self):
        self.files_service_url = settings.FILES_SERVICE_URL
        self.timeout = 30.0  # Увеличенный таймаут для загрузки файлов

    async def upload_file(
        self,
        file: UploadFile,
        project_id: str,
        file_type: str,
        uploaded_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Загрузить файл через files-service"""
        try:
            files = {
                "file": (file.filename, file.file, file.content_type)
            }
            data = {
                "project_id": project_id,
                "file_type": file_type,
            }
            if uploaded_by:
                data["uploaded_by"] = uploaded_by

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.files_service_url}/files/upload",
                    files=files,
                    data=data
                )

                if response.status_code == 413:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowed size"
                    )
                elif response.status_code == 400:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=response.json().get("detail", "Bad request")
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file: {str(e)}"
            )

    async def download_file(self, file_id: str) -> bytes:
        """Скачать файл через files-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.files_service_url}/files/{file_id}/download"
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found"
                    )

                response.raise_for_status()
                return response.content

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to download file: {str(e)}"
            )

    async def get_file_metadata(self, file_id: str) -> Dict[str, Any]:
        """Получить метаданные файла через files-service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.files_service_url}/files/{file_id}"
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found"
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )
        except HTTPException:
            raise

    async def get_project_files(self, project_id: str) -> list:
        """Получить все файлы проекта через files-service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.files_service_url}/files/project/{project_id}"
                )
                response.raise_for_status()
                result = response.json()
                files = result.get("files", [])

                # Для VM_TEMPLATE файлов загружаем содержимое
                for file in files:
                    if file.get("file_type") == "VM_TEMPLATE":
                        try:
                            file_content = await self.download_file(file["id"])
                            file["template"] = file_content.decode('utf-8')
                        except Exception as e:
                            # Если не удалось загрузить содержимое, просто пропускаем
                            file["template"] = None

                return files

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )

    async def delete_file(self, file_id: str) -> bool:
        """Удалить файл через files-service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.files_service_url}/files/{file_id}"
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="File not found"
                    )

                response.raise_for_status()
                return True

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )
        except HTTPException:
            raise

    async def upload_file_content(
        self,
        project_id: str,
        file_name: str,
        file_content: bytes,
        file_type: str,
        uploaded_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Загрузить файл из байтов через files-service"""
        try:
            import io
            file_obj = io.BytesIO(file_content)

            files = {
                "file": (file_name, file_obj, "application/octet-stream")
            }
            data = {
                "project_id": project_id,
                "file_type": file_type,
            }
            if uploaded_by:
                data["uploaded_by"] = uploaded_by

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.files_service_url}/files/upload",
                    files=files,
                    data=data
                )

                if response.status_code == 413:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowed size"
                    )
                elif response.status_code == 400:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=response.json().get("detail", "Bad request")
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Files service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to files service: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file content: {str(e)}"
            )

