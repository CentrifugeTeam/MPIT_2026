from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ============ PARSE SCHEMAS ============

class JsonField(BaseModel):
    """Поле из JSON-схемы"""
    id: str
    label: Optional[str] = None
    type: str = "string"
    required: bool = False
    path: str
    description: Optional[str] = None

class ParsedJsonSchema(BaseModel):
    """Результат парсинга JSON-схемы"""
    fields: List[JsonField]
    total_fields: int
    schema_version: Optional[str] = None

class XmlElement(BaseModel):
    """XML элемент из XSD-схемы"""
    name: str
    type: Optional[str] = None
    path: Optional[str] = None
    required: bool = False
    min_occurs: int = 0
    max_occurs: Optional[int] = None
    parent: Optional[str] = None
    description: Optional[str] = None

class ParsedXsdSchema(BaseModel):
    """Результат парсинга XSD-схемы"""
    elements: List[XmlElement]
    total_elements: int
    root_element: Optional[str] = None
    namespace: Optional[str] = None

# ============ MAPPING SCHEMAS ============

class MappingSuggestion(BaseModel):
    """Предложение маппинга"""
    json_field_id: str
    json_field_path: str
    json_field_label: Optional[str] = None
    xml_element_name: str
    xml_element_path: Optional[str] = None
    variable_name: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    is_auto_mapped: bool = True
    data_type: Optional[str] = None

class AutoMapRequest(BaseModel):
    """Запрос автоматического маппинга"""
    json_schema: ParsedJsonSchema
    xsd_schema: ParsedXsdSchema

class AutoMapResponse(BaseModel):
    """Ответ автоматического маппинга"""
    success: bool
    mappings: List[MappingSuggestion] = []
    total_mapped: int = 0
    total_unmapped: int = 0
    unmapped_json_fields: List[str] = []
    unmapped_xml_elements: List[str] = []

# ============ GENERATION SCHEMAS ============

class GenerateTemplateRequest(BaseModel):
    """Запрос генерации VM-шаблона"""
    mappings: List[MappingSuggestion]
    xsd_structure: ParsedXsdSchema
    include_comments: bool = True
    include_null_checks: bool = True

class GenerateTemplateResponse(BaseModel):
    """Ответ генерации VM-шаблона"""
    success: bool
    template: Optional[str] = None
    error: Optional[str] = None
    line_count: int = 0

class PreviewRequest(BaseModel):
    """Запрос предпросмотра результата"""
    template: str
    test_data: Dict[str, Any]

class PreviewResponse(BaseModel):
    """Ответ предпросмотра"""
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None

# ============ VALIDATION SCHEMAS ============

class ValidationError(BaseModel):
    """Ошибка валидации"""
    line: Optional[int] = None
    message: str
    severity: str = "error"

class ValidateTemplateResponse(BaseModel):
    """Ответ валидации шаблона"""
    is_valid: bool
    errors: List[ValidationError] = []
    warnings: List[ValidationError] = []

# ============ COMPLETE FLOW SCHEMAS ============

class CompleteGenerationRequest(BaseModel):
    """Полный цикл генерации"""
    project_id: str
    json_file_id: str
    xsd_file_id: str
    test_data_file_id: Optional[str] = None
    include_preview: bool = False

class CompleteGenerationResponse(BaseModel):
    """Результат полного цикла"""
    success: bool
    parsed_json: Optional[ParsedJsonSchema] = None
    parsed_xsd: Optional[ParsedXsdSchema] = None
    mappings: List[MappingSuggestion] = []
    template: Optional[str] = None
    preview_output: Optional[str] = None
    validation: Optional[ValidateTemplateResponse] = None
    template_file_id: Optional[str] = None
    error: Optional[str] = None

# ============ ORCHESTRATION SCHEMAS ============

class ParseFilesRequest(BaseModel):
    """Запрос парсинга файлов проекта"""
    project_id: str

class ParseFilesResponse(BaseModel):
    """Ответ парсинга файлов"""
    success: bool
    json_schema: Optional[ParsedJsonSchema] = None
    xsd_schema: Optional[ParsedXsdSchema] = None
    error: Optional[str] = None

class GenerateAndSaveRequest(BaseModel):
    """Запрос генерации и сохранения шаблона - нужен только project_id!"""
    project_id: str
    # Опциональные параметры (если не указаны - берутся из файла test_data в проекте или пропускаются)
    test_data: Optional[Dict[str, Any]] = None 
    include_comments: bool = True
    include_null_checks: bool = True

class GenerateAndSaveResponse(BaseModel):
    """Ответ генерации и сохранения"""
    success: bool
    template_file_id: Optional[str] = None
    template: Optional[str] = None
    mappings_count: int = 0
    validation: Optional[ValidateTemplateResponse] = None
    error: Optional[str] = None

