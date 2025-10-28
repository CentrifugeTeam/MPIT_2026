import httpx
from typing import Dict, Any, Optional, List
from fastapi import HTTPException, status
from app.core.config import get_settings

settings = get_settings()

class ProjectsService:
    def __init__(self):
        self.projects_service_url = settings.PROJECTS_SERVICE_URL
        self.timeout = 30.0

    async def create_project(
        self,
        name: str,
        description: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """Создать проект через projects-service"""
        try:
            data = {"name": name}
            if description:
                data["description"] = description

            params = {}
            if created_by:
                params["created_by"] = created_by

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.projects_service_url}/projects/",
                    json=data,
                    params=params
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def get_projects(
        self,
        created_by: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Dict[str, Any]:
        """Получить список проектов через projects-service"""
        try:
            params = {"skip": skip, "limit": limit}
            if created_by:
                params["created_by"] = created_by
            if status_filter:
                params["status"] = status_filter
            if search:
                params["search"] = search
            if sort_by:
                params["sort_by"] = sort_by
            if sort_order:
                params["sort_order"] = sort_order

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.projects_service_url}/projects/",
                    params=params
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def get_user_projects(
        self,
        user_email: str,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None
    ) -> Dict[str, Any]:
        """Получить все проекты конкретного пользователя через projects-service"""
        try:
            params = {"skip": skip, "limit": limit}
            if status_filter:
                params["status"] = status_filter
            if search:
                params["search"] = search
            if sort_by:
                params["sort_by"] = sort_by
            if sort_order:
                params["sort_order"] = sort_order

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.projects_service_url}/projects/user/{user_email}",
                    params=params
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def get_project(
        self,
        project_id: str,
        include_mappings: bool = True,
        include_history: bool = False,
        include_files: bool = True
    ) -> Dict[str, Any]:
        """Получить проект по ID через projects-service"""
        try:
            params = {
                "include_mappings": include_mappings,
                "include_history": include_history,
                "include_files": include_files
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.projects_service_url}/projects/{project_id}",
                    params=params
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Project not found"
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )
        except HTTPException:
            raise

    async def update_project(
        self,
        project_id: str,
        update_data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Обновить проект через projects-service"""
        try:
            params = {}
            if user_id:
                params["user_id"] = user_id

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.put(
                    f"{self.projects_service_url}/projects/{project_id}",
                    json=update_data,
                    params=params
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Project not found"
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )
        except HTTPException:
            raise

    async def delete_project(self, project_id: str) -> bool:
        """Удалить проект через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.projects_service_url}/projects/{project_id}"
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Project not found"
                    )

                response.raise_for_status()
                return True

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )
        except HTTPException:
            raise

    # ============ FIELD MAPPINGS ============

    async def create_field_mapping(
        self,
        project_id: str,
        mapping_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Создать маппинг поля через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.projects_service_url}/mappings/",
                    json=mapping_data,
                    params={"project_id": project_id}
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def bulk_create_mappings(
        self,
        project_id: str,
        mappings: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Массовое создание маппингов через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.projects_service_url}/mappings/bulk",
                    json=mappings,
                    params={"project_id": project_id}
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def get_project_mappings(self, project_id: str) -> Dict[str, Any]:
        """Получить маппинги проекта через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.projects_service_url}/mappings/{project_id}"
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )

    async def update_field_mapping(
        self,
        mapping_id: str,
        update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Обновить маппинг через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.put(
                    f"{self.projects_service_url}/mappings/{mapping_id}",
                    json=update_data
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Mapping not found"
                    )

                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )
        except HTTPException:
            raise

    async def delete_field_mapping(self, mapping_id: str) -> bool:
        """Удалить маппинг через projects-service"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.delete(
                    f"{self.projects_service_url}/mappings/{mapping_id}"
                )

                if response.status_code == 404:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Mapping not found"
                    )

                response.raise_for_status()
                return True

        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Projects service error: {e.response.text}"
            )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Cannot connect to projects service: {str(e)}"
            )
        except HTTPException:
            raise

