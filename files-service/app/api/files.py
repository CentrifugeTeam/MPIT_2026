from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import UUID, uuid4
from typing import Optional
from app.database import get_db
from app.schemas import FileUploadResponse, FileResponse as FileResponseSchema, FileListResponse, FileType
from app.services.storage import StorageService
import app.crud as crud
from app.models import FileType as FileTypeEnum

router = APIRouter()
storage_service = StorageService()

@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    file_type: str = Form(...),
    uploaded_by: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Загрузить файл в систему"""
    try:
        project_uuid = UUID(project_id)

        if file_type not in [ft.value for ft in FileTypeEnum]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file_type. Must be one of: {[ft.value for ft in FileTypeEnum]}"
            )

        file_id = uuid4()

        file_path, file_size, checksum = await storage_service.save_file(
            file=file,
            project_id=project_uuid,
            file_type=file_type,
            file_id=file_id
        )

        mime_type = file.content_type or "application/octet-stream"

        uploaded_by_uuid = UUID(uploaded_by) if uploaded_by else None

        db_file = crud.create_file(
            db=db,
            file_id=file_id,
            project_id=project_uuid,
            file_name=file.filename,
            file_type=FileTypeEnum[file_type],
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            checksum=checksum,
            uploaded_by=uploaded_by_uuid
        )

        return FileUploadResponse(
            id=str(db_file.id),
            project_id=str(db_file.project_id),
            file_name=db_file.file_name,
            file_type=db_file.file_type.value,
            file_path=db_file.file_path,
            file_size=db_file.file_size,
            mime_type=db_file.mime_type,
            checksum=db_file.checksum,
            uploaded_by=str(db_file.uploaded_by) if db_file.uploaded_by else None,
            created_at=db_file.created_at
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """Скачать файл по ID"""
    try:
        file_uuid = UUID(file_id)

        db_file = crud.get_file_by_id(db, file_uuid)
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        file_path = storage_service.get_file_path(db_file.file_path)

        return FileResponse(
            path=str(file_path),
            filename=db_file.file_name,
            media_type=db_file.mime_type
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file_id format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {str(e)}"
        )

@router.get("/{file_id}", response_model=FileResponseSchema)
async def get_file_metadata(
    file_id: str,
    db: Session = Depends(get_db)
):
    """Получить метаданные файла"""
    try:
        file_uuid = UUID(file_id)

        db_file = crud.get_file_by_id(db, file_uuid)
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        return FileResponseSchema(
            id=str(db_file.id),
            project_id=str(db_file.project_id),
            file_name=db_file.file_name,
            file_type=db_file.file_type.value,
            file_size=db_file.file_size,
            mime_type=db_file.mime_type,
            checksum=db_file.checksum,
            uploaded_by=str(db_file.uploaded_by) if db_file.uploaded_by else None,
            created_at=db_file.created_at,
            updated_at=db_file.updated_at
        )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file_id format"
        )

@router.get("/project/{project_id}", response_model=FileListResponse)
async def get_project_files(
    project_id: str,
    skip: int = Query(0, ge=0),
    limit: Optional[int] = Query(None, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Получить файлы проекта с пагинацией"""
    try:
        project_uuid = UUID(project_id)

        total = crud.count_files_by_project(db, project_uuid)

        db_files = crud.get_files_by_project(db, project_uuid, skip=skip, limit=limit)

        files = [
            FileResponseSchema(
                id=str(f.id),
                project_id=str(f.project_id),
                file_name=f.file_name,
                file_type=f.file_type.value,
                file_size=f.file_size,
                mime_type=f.mime_type,
                checksum=f.checksum,
                uploaded_by=str(f.uploaded_by) if f.uploaded_by else None,
                created_at=f.created_at,
                updated_at=f.updated_at
            )
            for f in db_files
        ]

        return FileListResponse(files=files, total=total)

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    db: Session = Depends(get_db)
):
    """Удалить файл"""
    try:
        file_uuid = UUID(file_id)

        db_file = crud.get_file_by_id(db, file_uuid)
        if not db_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        storage_service.delete_file(db_file.file_path)

        crud.delete_file(db, file_uuid)

        return None

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file_id format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete file: {str(e)}"
        )
