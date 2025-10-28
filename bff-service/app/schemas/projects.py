from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ProjectStatus(str, Enum):
    DRAFT = "DRAFT"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

# ============ PROJECT SCHEMAS ============

class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_size: int = 0

class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int

# ============ FIELD MAPPING SCHEMAS ============

class FieldMappingCreate(BaseModel):
    json_field_id: str
    json_field_path: str
    json_field_label: Optional[str] = None
    xml_element_name: str
    xml_element_path: Optional[str] = None
    variable_name: str
    is_auto_mapped: bool = True
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)

class FieldMappingUpdate(BaseModel):
    json_field_id: Optional[str] = None
    json_field_path: Optional[str] = None
    json_field_label: Optional[str] = None
    xml_element_name: Optional[str] = None
    xml_element_path: Optional[str] = None
    variable_name: Optional[str] = None
    is_auto_mapped: Optional[bool] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)

class FieldMappingResponse(BaseModel):
    id: str
    project_id: str
    json_field_id: str
    json_field_path: str
    json_field_label: Optional[str] = None
    xml_element_name: str
    xml_element_path: Optional[str] = None
    variable_name: str
    is_auto_mapped: bool
    confidence_score: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class FieldMappingListResponse(BaseModel):
    mappings: List[FieldMappingResponse]
    total: int

# ============ PROJECT HISTORY SCHEMAS ============

class ProjectHistoryResponse(BaseModel):
    id: str
    project_id: str
    action: str
    user_id: Optional[str] = None
    changes: Optional[dict] = None
    description: Optional[str] = None
    timestamp: datetime

class ProjectHistoryListResponse(BaseModel):
    history: List[ProjectHistoryResponse]
    total: int

# ============ FILE RESPONSE (из files-service) ============

class FileResponse(BaseModel):
    """Информация о файле проекта"""
    id: str
    file_name: str
    file_type: str
    file_size: int
    mime_type: str
    created_at: datetime

# ============ DETAILED PROJECT RESPONSE ============

class ProjectDetailedResponse(ProjectResponse):
    """Детальная информация о проекте с маппингами"""
    mappings: List[FieldMappingResponse] = []
    history: List[ProjectHistoryResponse] = []
    files: List[FileResponse] = []

