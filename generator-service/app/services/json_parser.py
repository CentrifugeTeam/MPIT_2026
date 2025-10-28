import json
from typing import List, Dict, Any, Optional
from jsonschema import ValidationError as JsonSchemaValidationError
from app.schemas import JsonField, ParsedJsonSchema, DataType

class JsonSchemaParser:
    """
    Парсер JSON-схем форм ЕПГУ
    
    Извлекает поля и их метаданные из JSON-схемы формы.
    Поддерживает множество форматов:
    - Простые JSON Schema (properties)
    - Простые схемы с полем fields
    - Сложные схемы ЕПГУ (screens + components)
    """
    
    def parse(self, file_content: str) -> ParsedJsonSchema:
        """
        Парсинг JSON-схемы
        
        Автоматически определяет формат схемы и извлекает поля.
        
        Args:
            file_content: Содержимое JSON файла
            
        Returns:
            ParsedJsonSchema с извлеченными полями
        """
        try:
            data = json.loads(file_content)
            
            # Определяем формат схемы и извлекаем поля
            fields = self.extract_fields(data)
            
            # Конвертируем version в строку (может быть int или str)
            version = data.get("version")
            if version is not None:
                version = str(version)
            
            return ParsedJsonSchema(
                fields=fields,
                total_fields=len(fields),
                schema_version=version
            )
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error parsing JSON schema: {str(e)}")
    
    def extract_fields(self, schema: Dict[str, Any], prefix: str = "$request") -> List[JsonField]:
        """
        Рекурсивное извлечение полей из схемы
        
        Автоматически определяет формат:
        - ЕПГУ формат (screens + компоненты)
        - Простой формат (fields)
        - JSON Schema (properties)
        
        Args:
            schema: JSON схема
            prefix: Префикс для JSONPath
            
        Returns:
            Список полей
        """
        fields = []
        
        # 1. Проверяем формат ЕПГУ (screens + components)
        if "screens" in schema or "service" in schema:
            fields = self._extract_epgu_fields(schema, prefix)
        
        # 2. Формат с явным списком полей
        elif "fields" in schema:
            for field_data in schema.get("fields", []):
                field = self._parse_field(field_data, prefix)
                if field:
                    fields.append(field)
        
        # 3. JSON Schema формат
        elif "properties" in schema:
            for field_name, field_data in schema.get("properties", {}).items():
                field = self._parse_property(field_name, field_data, prefix)
                if field:
                    fields.append(field)
        
        return fields
    
    def _parse_field(self, field_data: Dict[str, Any], prefix: str) -> JsonField:
        """Парсинг поля из формата ЕПГУ"""
        field_id = field_data.get("id") or field_data.get("name")
        if not field_id:
            return None
        
        field_type = self._map_type(field_data.get("type", "string"))
        
        return JsonField(
            id=field_id,
            label=field_data.get("label") or field_data.get("title"),
            type=field_type,
            required=field_data.get("required", False),
            path=f"{prefix}.{field_id}",
            description=field_data.get("description")
        )
    
    def _parse_property(self, field_name: str, field_data: Dict[str, Any], prefix: str) -> JsonField:
        """Парсинг поля из JSON Schema формата"""
        field_type = self._map_type(field_data.get("type", "string"))
        
        return JsonField(
            id=field_name,
            label=field_data.get("title"),
            type=field_type,
            required=False,  # required определяется на уровне schema
            path=f"{prefix}.{field_name}",
            description=field_data.get("description")
        )
    
    def _map_type(self, type_str: str) -> DataType:
        """Маппинг типов JSON на DataType"""
        type_mapping = {
            "string": DataType.STRING,
            "text": DataType.STRING,
            "number": DataType.NUMBER,
            "integer": DataType.INTEGER,
            "int": DataType.INTEGER,
            "boolean": DataType.BOOLEAN,
            "bool": DataType.BOOLEAN,
            "date": DataType.DATE,
            "datetime": DataType.DATETIME,
            "array": DataType.ARRAY,
            "object": DataType.OBJECT
        }
        return type_mapping.get(type_str.lower(), DataType.STRING)
    
    def _extract_epgu_fields(self, schema: Dict[str, Any], prefix: str) -> List[JsonField]:
        """
        Извлечение полей из формата ЕПГУ
        
        Формат ЕПГУ содержит:
        - screens[] с component IDs
        - Отдельный список компонентов с полным описанием
        
        Args:
            schema: Схема ЕПГУ
            prefix: Префикс для path
            
        Returns:
            Список извлеченных полей
        """
        fields = []
        components_dict = {}
        
        # Ищем все компоненты в схеме (они могут быть в разных местах)
        # Обычно они идут после screens как отдельный массив элементов
        
        # Способ 1: Прямой поиск компонентов в корне (после screens)
        if isinstance(schema, dict):
            for key, value in schema.items():
                if isinstance(value, list):
                    for item in value:
                        if isinstance(item, dict) and "id" in item and "type" in item:
                            # Это похоже на компонент
                            comp_id = item.get("id")
                            if comp_id:
                                components_dict[comp_id] = item
        
        # Способ 2: Собираем компоненты из первых элементов после screens
        # В ЕПГУ файлах компоненты идут как отдельный массив
        screens = schema.get("screens", [])
        
        # Находим все уникальные component IDs из screens
        component_ids = set()
        for screen in screens:
            for comp_id in screen.get("components", []):
                component_ids.add(comp_id)
        
        # Создаем поля из найденных компонентов
        for comp_id, component in components_dict.items():
            # Извлекаем информацию о поле
            field_type = self._map_component_type(component.get("type", "string"))
            label = component.get("label") or component.get("name")
            
            # Получаем дополнительную информацию из attrs
            attrs = component.get("attrs") or {}
            required = component.get("required", False) or (attrs.get("required", False) if isinstance(attrs, dict) else False)
            
            field = JsonField(
                id=comp_id,
                label=label,
                type=field_type,
                required=required,
                path=f"{prefix}.{comp_id}",
                description=component.get("description")
            )
            fields.append(field)
        
        # Если не нашли компонентов стандартным способом, пробуем более агрессивный поиск
        if not fields:
            fields = self._deep_search_components(schema, prefix)
        
        return fields
    
    def _deep_search_components(self, data: Any, prefix: str, depth: int = 0, max_depth: int = 10) -> List[JsonField]:
        """
        Глубокий рекурсивный поиск компонентов в структуре
        
        Args:
            data: Данные для поиска
            prefix: Префикс пути
            depth: Текущая глубина
            max_depth: Максимальная глубина поиска
            
        Returns:
            Список найденных полей
        """
        if depth > max_depth:
            return []
        
        fields = []
        
        if isinstance(data, dict):
            # Если это похоже на компонент
            if "id" in data and "type" in data:
                comp_id = data.get("id")
                comp_type = data.get("type")
                
                # Исключаем экраны и служебные компоненты
                excluded_types = {"QUESTION", "INFO", "UNIQUE", "CUSTOM", "QuestionScr"}
                if comp_type not in excluded_types:
                    label = data.get("label") or data.get("name")
                    field_type = self._map_component_type(comp_type)
                    
                    field = JsonField(
                        id=comp_id,
                        label=label,
                        type=field_type,
                        required=data.get("required", False),
                        path=f"{prefix}.{comp_id}",
                        description=data.get("description")
                    )
                    fields.append(field)
            
            # Рекурсивно обходим вложенные объекты
            for key, value in data.items():
                if key not in ["screens"]:  # Не проваливаемся в screens повторно
                    fields.extend(self._deep_search_components(value, prefix, depth + 1, max_depth))
        
        elif isinstance(data, list):
            for item in data:
                fields.extend(self._deep_search_components(item, prefix, depth + 1, max_depth))
        
        return fields
    
    def _map_component_type(self, comp_type: str) -> DataType:
        """
        Маппинг типов компонентов ЕПГУ на DataType
        
        Args:
            comp_type: Тип компонента ЕПГУ
            
        Returns:
            DataType
        """
        type_mapping = {
            # Текстовые поля
            "TextInput": DataType.STRING,
            "TextArea": DataType.STRING,
            "StringInput": DataType.STRING,
            
            # Выбор
            "RadioInput": DataType.STRING,
            "CheckBox": DataType.BOOLEAN,
            "Dropdown": DataType.STRING,
            "QuestionScr": DataType.STRING,
            
            # Даты
            "DateInput": DataType.DATE,
            "DateTimeInput": DataType.DATETIME,
            
            # Числа
            "NumberInput": DataType.NUMBER,
            
            # Файлы
            "FileUploadComponent": DataType.STRING,
            
            # Адреса
            "AddressInput": DataType.OBJECT,
            
            # Личные данные
            "PersonalData": DataType.OBJECT,
            "SnilsInput": DataType.STRING,
            "PassportInput": DataType.OBJECT,
            
            # Повторяющиеся группы
            "RepeatableFields": DataType.ARRAY,
            "CycledApplicantAnswers": DataType.ARRAY,
        }
        
        return type_mapping.get(comp_type, DataType.STRING)
    
    def validate_schema(self, schema: Dict[str, Any]) -> bool:
        """
        Валидация JSON схемы
        
        Args:
            schema: JSON схема для валидации
            
        Returns:
            True если валидна
        """
        # Проверяем базовую структуру
        if not isinstance(schema, dict):
            raise ValueError("Schema must be a dictionary")
        
        # Проверяем наличие полей (в любом формате)
        has_fields = (
            "fields" in schema or 
            "properties" in schema or 
            "screens" in schema or
            "service" in schema
        )
        
        if not has_fields:
            raise ValueError("Schema must contain 'fields', 'properties', 'screens' or be an EPGU service schema")
        
        return True

