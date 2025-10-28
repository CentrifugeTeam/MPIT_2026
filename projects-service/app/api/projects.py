from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional, List
from app.database import get_db
from app.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    ProjectDetailedResponse, FieldMappingResponse, ProjectHistoryResponse,
    ProjectStatus
)
import app.crud as crud
from app.services.files_client import FilesClient

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    created_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Создать новый проект"""
    try:
        db_project = crud.create_project(
            db=db,
            project=project,
            created_by=created_by
        )

        return ProjectResponse(
            id=str(db_project.id),
            name=db_project.name,
            description=db_project.description,
            status=db_project.status.value,
            created_by=db_project.created_by,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at,
            total_size=0
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.get("/", response_model=ProjectListResponse)
async def get_projects(
    created_by: Optional[str] = Query(None),
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Поиск по названию проекта"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: Optional[str] = Query(None, description="Поле для сортировки"),
    sort_order: Optional[str] = Query(None, description="Направление сортировки"),
    db: Session = Depends(get_db)
):
    """Получить список проектов с сортировкой"""
    try:
        total = crud.count_projects(
            db=db,
            created_by=created_by,
            status=status_filter,
            search=search
        )

        db_projects = crud.get_projects(
            db=db,
            created_by=created_by,
            status=status_filter,
            search=search,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        files_client = FilesClient()
        projects = []
        for p in db_projects:
            total_size = await files_client.get_project_total_size(str(p.id))
            projects.append(ProjectResponse(
                id=str(p.id),
                name=p.name,
                description=p.description,
                status=p.status.value,
                created_by=p.created_by,
                created_at=p.created_at,
                updated_at=p.updated_at,
                total_size=total_size
            ))

        # Сортировка по total_size на уровне приложения
        if sort_by == "total_size":
            reverse = (sort_order == "desc")
            projects.sort(key=lambda x: x.total_size, reverse=reverse)

        return ProjectListResponse(projects=projects, total=total)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get projects: {str(e)}"
        )

@router.get("/user/{user_email}", response_model=ProjectListResponse)
async def get_user_projects(
    user_email: str,
    status_filter: Optional[ProjectStatus] = Query(None, alias="status"),
    search: Optional[str] = Query(None, description="Поиск по названию проекта"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    sort_by: Optional[str] = Query(None, description="Поле для сортировки"),
    sort_order: Optional[str] = Query(None, description="Направление сортировки"),
    db: Session = Depends(get_db)
):
    """Получить все проекты конкретного пользователя с сортировкой"""
    try:
        total = crud.count_projects(
            db=db,
            created_by=user_email,
            status=status_filter,
            search=search
        )

        db_projects = crud.get_projects(
            db=db,
            created_by=user_email,
            status=status_filter,
            search=search,
            skip=skip,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        files_client = FilesClient()
        projects = []
        for p in db_projects:
            total_size = await files_client.get_project_total_size(str(p.id))
            projects.append(ProjectResponse(
                id=str(p.id),
                name=p.name,
                description=p.description,
                status=p.status.value,
                created_by=p.created_by,
                created_at=p.created_at,
                updated_at=p.updated_at,
                total_size=total_size
            ))

        # Сортировка по total_size на уровне приложения
        if sort_by == "total_size":
            reverse = (sort_order == "desc")
            projects.sort(key=lambda x: x.total_size, reverse=reverse)

        return ProjectListResponse(projects=projects, total=total)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user projects: {str(e)}"
        )

@router.get("/{project_id}", response_model=ProjectDetailedResponse)
async def get_project(
    project_id: str,
    include_mappings: bool = Query(True),
    include_history: bool = Query(False),
    include_files: bool = Query(True),
    db: Session = Depends(get_db)
):
    """Получить детальную информацию о проекте"""
    try:
        project_uuid = UUID(project_id)

        db_project = crud.get_project(db, project_uuid)
        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        response_data = {
            "id": str(db_project.id),
            "name": db_project.name,
            "description": db_project.description,
            "status": db_project.status.value,
            "created_by": db_project.created_by,
            "created_at": db_project.created_at,
            "updated_at": db_project.updated_at,
            "mappings": [],
            "history": [],
            "files": []
        }

        if include_mappings:
            mappings = crud.get_project_mappings(db, project_uuid)
            response_data["mappings"] = [
                FieldMappingResponse(
                    id=str(m.id),
                    project_id=str(m.project_id),
                    json_field_id=m.json_field_id,
                    json_field_path=m.json_field_path,
                    json_field_label=m.json_field_label,
                    xml_element_name=m.xml_element_name,
                    xml_element_path=m.xml_element_path,
                    variable_name=m.variable_name,
                    is_auto_mapped=m.is_auto_mapped,
                    confidence_score=m.confidence_score,
                    created_at=m.created_at,
                    updated_at=m.updated_at
                )
                for m in mappings
            ]

        if include_history:
            history = crud.get_project_history(db, project_uuid, limit=20)
            response_data["history"] = [
                ProjectHistoryResponse(
                    id=str(h.id),
                    project_id=str(h.project_id),
                    action=h.action,
                    user_id=h.user_id,
                    changes=h.changes,
                    description=h.description,
                    timestamp=h.timestamp
                )
                for h in history
            ]

        if include_files:
            files_client = FilesClient()
            project_files = await files_client.get_project_files(project_id)
            response_data["files"] = [
                {
                    "id": f.get("id"),
                    "file_name": f.get("file_name"),
                    "file_type": f.get("file_type"),
                    "file_size": f.get("file_size"),
                    "mime_type": f.get("mime_type"),
                    "created_at": f.get("created_at")
                }
                for f in project_files
            ]

        return ProjectDetailedResponse(**response_data)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Обновить проект"""
    try:
        project_uuid = UUID(project_id)

        db_project = crud.update_project(
            db=db,
            project_id=project_uuid,
            project_update=project_update,
            user_id=user_id  # user_id уже строка (email), не нужно конвертировать в UUID
        )

        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        files_client = FilesClient()
        total_size = await files_client.get_project_total_size(project_id)

        return ProjectResponse(
            id=str(db_project.id),
            name=db_project.name,
            description=db_project.description,
            status=db_project.status.value,
            created_by=db_project.created_by,
            created_at=db_project.created_at,
            updated_at=db_project.updated_at,
            total_size=total_size
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format"
        )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: Session = Depends(get_db)
):
    """Удалить проект и все связанные файлы"""
    try:
        project_uuid = UUID(project_id)

        db_project = crud.get_project(db, project_uuid)
        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

        files_client = FilesClient()
        project_files = await files_client.get_project_files(project_id)

        deleted_files = []
        failed_files = []

        for file_info in project_files:
            file_id = file_info.get("id")
            if file_id:
                success = await files_client.delete_file(file_id)
                if success:
                    deleted_files.append(file_id)
                else:
                    failed_files.append(file_id)

        if failed_files:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete files: {failed_files}. Project not deleted."
            )

        success = crud.delete_project(db, project_uuid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete project from database"
            )

        return None

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )
    except HTTPException:
        raise

