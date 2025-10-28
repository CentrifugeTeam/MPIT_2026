from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# ============ ENUMS ============

class FileType(str, Enum):
    JSON_SCHEMA = "JSON_SCHEMA"
    XSD_SCHEMA = "XSD_SCHEMA"
    TEST_DATA = "TEST_DATA"

class DataType(str, Enum):
    STRING = "string"
    NUMBER = "number"
    INTEGER = "integer"
    BOOLEAN = "boolean"
    DATE = "date"
    DATETIME = "datetime"
    ARRAY = "array"
    OBJECT = "object"

# ============ JSON SCHEMA PARSING ============

class JsonField(BaseModel):
    """Поле из JSON-схемы"""
    id: str
    label: Optional[str] = None
    type: DataType = DataType.STRING
    required: bool = False
    path: str  # JSONPath: $request.fieldName
    description: Optional[str] = None

class ParsedJsonSchema(BaseModel):
    """Результат парсинга JSON-схемы"""
    fields: List[JsonField]
    total_fields: int
    schema_version: Optional[str] = None

class JsonSchemaParseRequest(BaseModel):
    """Запрос на парсинг JSON-схемы"""
    file_content: str  # JSON в виде строки
    
class JsonSchemaParseResponse(BaseModel):
    """Ответ парсинга JSON-схемы"""
    success: bool
    data: Optional[ParsedJsonSchema] = None
    error: Optional[str] = None

# ============ XSD SCHEMA PARSING ============

class XmlElement(BaseModel):
    """XML элемент из XSD-схемы"""
    name: str
    type: Optional[str] = None
    path: Optional[str] = None  # XPath
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

class XsdSchemaParseRequest(BaseModel):
    """Запрос на парсинг XSD-схемы"""
    file_content: str  # XSD в виде строки

class XsdSchemaParseResponse(BaseModel):
    """Ответ парсинга XSD-схемы"""
    success: bool
    data: Optional[ParsedXsdSchema] = None
    error: Optional[str] = None

# ============ FIELD MAPPING ============

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
    data_type: Optional[DataType] = None

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

class SimilarityRequest(BaseModel):
    """Запрос вычисления схожести"""
    source: str
    target: str

class SimilarityResponse(BaseModel):
    """Ответ вычисления схожести"""
    similarity: float = Field(ge=0.0, le=1.0)
    algorithm: str = "levenshtein"

# ============ VM TEMPLATE GENERATION ============

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
    test_data: Dict[str, Any]  # Тестовые JSON данные

class PreviewResponse(BaseModel):
    """Ответ предпросмотра"""
    success: bool
    output: Optional[str] = None  # Сгенерированный XML
    error: Optional[str] = None

# ============ TEMPLATE VALIDATION ============

class ValidationError(BaseModel):
    """Ошибка валидации"""
    line: Optional[int] = None
    message: str
    severity: str = "error"  # error, warning

class ValidateTemplateRequest(BaseModel):
    """Запрос валидации шаблона"""
    template: str
    mappings: Optional[List[MappingSuggestion]] = None

class ValidateTemplateResponse(BaseModel):
    """Ответ валидации шаблона"""
    is_valid: bool
    errors: List[ValidationError] = []
    warnings: List[ValidationError] = []

class ValidateOutputRequest(BaseModel):
    """Запрос валидации выходного XML"""
    xml_output: str
    xsd_schema: str

class ValidateOutputResponse(BaseModel):
    """Ответ валидации выходного XML"""
    is_valid: bool
    errors: List[ValidationError] = []

# ============ COMPLETE FLOW ============

class CompleteGenerationRequest(BaseModel):
    """Полный цикл: парсинг -> маппинг -> генерация"""
    json_schema_content: str
    xsd_schema_content: str
    test_data: Optional[Dict[str, Any]] = None
    include_preview: bool = False
    include_comments: bool = True  # Добавить комментарии в шаблон
    include_null_checks: bool = True  # Добавить проверки на null

class CompleteGenerationResponse(BaseModel):
    """Результат полного цикла"""
    success: bool
    parsed_json: Optional[ParsedJsonSchema] = None
    parsed_xsd: Optional[ParsedXsdSchema] = None
    mappings: List[MappingSuggestion] = []
    template: Optional[str] = None
    preview_output: Optional[str] = None
    validation: Optional[ValidateTemplateResponse] = None
    error: Optional[str] = None

