// Запрос на генерацию
export interface GenerateRequest {
  json_schema_content: string;
  xsd_schema_content: string;
  test_data?: Record<string, any>;
  include_preview?: boolean;
  include_comments?: boolean;
  include_null_checks?: boolean;
}

// Парсед JSON поле
export interface ParsedJsonField {
  id: string;
  path: string;
  type: string;
  label: string;
  required: boolean;
}

// Парсед XSD элемент
export interface ParsedXsdElement {
  name: string;
  path: string;
  type: string;
  required: boolean;
}

// Маппинг между JSON и XML
export interface FieldMapping {
  json_field_id: string;
  json_field_path: string;
  json_field_label: string;
  xml_element_name: string;
  xml_element_path: string;
  variable_name: string;
  confidence_score: number;
  is_auto_mapped: boolean;
}

// Валидация шаблона
export interface TemplateValidation {
  is_valid: boolean;
  errors: Array<{
    line: number | null;
    message: string;
    severity: string;
  }>;
  warnings: Array<{
    line: number | null;
    message: string;
    severity: string;
  }>;
}

// Статистика генерации
export interface GenerationStats {
  total_mappings: number;
  auto_mapped: number;
  manual_mapped: number;
  avg_confidence: number;
  unmapped_json_fields: number;
  unmapped_xml_elements: number;
}

// Ответ от генератора
export interface GenerateResponse {
  success: boolean;
  parsed_json: {
    fields: ParsedJsonField[];
    total_fields: number;
  };
  parsed_xsd: {
    elements: ParsedXsdElement[];
    total_elements: number;
  };
  mappings: FieldMapping[];
  template: string;
  validation: TemplateValidation;
  preview?: string;
  stats: GenerationStats;
}
