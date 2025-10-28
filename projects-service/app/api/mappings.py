from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from app.database import get_db
from app.schemas import (
    FieldMappingCreate, FieldMappingUpdate, FieldMappingResponse, FieldMappingListResponse
)
import app.crud as crud

router = APIRouter()

@router.post("/", response_model=FieldMappingResponse, status_code=status.HTTP_201_CREATED)
async def create_field_mapping(
    project_id: str,
    mapping: FieldMappingCreate,
    db: Session = Depends(get_db)
):
    """Создать маппинг поля для проекта"""
    try:
        project_uuid = UUID(project_id)
        
        # Проверить существование проекта
        db_project = crud.get_project(db, project_uuid)
        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        db_mapping = crud.create_field_mapping(
            db=db,
            project_id=project_uuid,
            mapping=mapping
        )
        
        crud.create_history_entry(
            db=db,
            project_id=project_uuid,
            action="MAPPING_CREATED",
            description=f"Field mapping created: {mapping.json_field_id} -> {mapping.xml_element_name}"
        )
        
        return FieldMappingResponse(
            id=str(db_mapping.id),
            project_id=str(db_mapping.project_id),
            json_field_id=db_mapping.json_field_id,
            json_field_path=db_mapping.json_field_path,
            json_field_label=db_mapping.json_field_label,
            xml_element_name=db_mapping.xml_element_name,
            xml_element_path=db_mapping.xml_element_path,
            variable_name=db_mapping.variable_name,
            is_auto_mapped=db_mapping.is_auto_mapped,
            confidence_score=db_mapping.confidence_score,
            created_at=db_mapping.created_at,
            updated_at=db_mapping.updated_at
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format"
        )

@router.post("/bulk", response_model=FieldMappingListResponse, status_code=status.HTTP_201_CREATED)
async def bulk_create_mappings(
    project_id: str,
    mappings: List[FieldMappingCreate],
    db: Session = Depends(get_db)
):
    """Массовое создание маппингов для проекта"""
    try:
        project_uuid = UUID(project_id)
        
        db_project = crud.get_project(db, project_uuid)
        if not db_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        db_mappings = crud.bulk_create_mappings(
            db=db,
            project_id=project_uuid,
            mappings=mappings
        )
        
        crud.create_history_entry(
            db=db,
            project_id=project_uuid,
            action="MAPPINGS_CREATED",
            description=f"Bulk created {len(mappings)} field mappings"
        )
        
        response_mappings = [
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
            for m in db_mappings
        ]
        
        return FieldMappingListResponse(
            mappings=response_mappings,
            total=len(response_mappings)
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format"
        )

@router.get("/{project_id}", response_model=FieldMappingListResponse)
async def get_project_mappings(
    project_id: str,
    db: Session = Depends(get_db)
):
    """Получить все маппинги проекта"""
    try:
        project_uuid = UUID(project_id)
        
        db_mappings = crud.get_project_mappings(db, project_uuid)
        
        mappings = [
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
            for m in db_mappings
        ]
        
        return FieldMappingListResponse(mappings=mappings, total=len(mappings))
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project_id format"
        )

@router.put("/{mapping_id}", response_model=FieldMappingResponse)
async def update_field_mapping(
    mapping_id: str,
    mapping_update: FieldMappingUpdate,
    db: Session = Depends(get_db)
):
    """Обновить маппинг поля"""
    try:
        mapping_uuid = UUID(mapping_id)
        
        db_mapping = crud.update_field_mapping(
            db=db,
            mapping_id=mapping_uuid,
            mapping_update=mapping_update
        )
        
        if not db_mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mapping not found"
            )
        
        crud.create_history_entry(
            db=db,
            project_id=db_mapping.project_id,
            action="MAPPING_UPDATED",
            description=f"Field mapping updated: {db_mapping.json_field_id}"
        )
        
        return FieldMappingResponse(
            id=str(db_mapping.id),
            project_id=str(db_mapping.project_id),
            json_field_id=db_mapping.json_field_id,
            json_field_path=db_mapping.json_field_path,
            json_field_label=db_mapping.json_field_label,
            xml_element_name=db_mapping.xml_element_name,
            xml_element_path=db_mapping.xml_element_path,
            variable_name=db_mapping.variable_name,
            is_auto_mapped=db_mapping.is_auto_mapped,
            confidence_score=db_mapping.confidence_score,
            created_at=db_mapping.created_at,
            updated_at=db_mapping.updated_at
        )
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mapping_id format"
        )

@router.delete("/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field_mapping(
    mapping_id: str,
    db: Session = Depends(get_db)
):
    """Удалить маппинг поля"""
    try:
        mapping_uuid = UUID(mapping_id)
        
        db_mapping = crud.get_field_mapping(db, mapping_uuid)
        if not db_mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mapping not found"
            )
        
        project_id = db_mapping.project_id
        
        success = crud.delete_field_mapping(db, mapping_uuid)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mapping not found"
            )
        
        crud.create_history_entry(
            db=db,
            project_id=project_id,
            action="MAPPING_DELETED",
            description=f"Field mapping deleted"
        )
        
        return None
        
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mapping_id format"
        )

