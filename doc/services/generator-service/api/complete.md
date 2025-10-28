# Complete Generation API Routes

Полный цикл генерации VM шаблона (парсинг → маппинг → генерация → валидация).

## POST /api/complete/generate

Выполнить полный цикл генерации VM шаблона за один запрос.

### Request
```json
{
  "json_schema_content": "{ \"type\": \"object\", \"properties\": { ... } }",
  "xsd_schema_content": "<?xml version=\"1.0\"?>...",
  "test_data": {
    "request": {
      "surname": "Иванов",
      "name": "Иван"
    }
  },
  "include_preview": true,
  "include_comments": true,
  "include_null_checks": true
}
```

### Parameters
- `json_schema_content` (string, required) - Содержимое JSON схемы
- `xsd_schema_content` (string, required) - Содержимое XSD схемы
- `test_data` (object, optional) - Тестовые данные для предпросмотра
- `include_preview` (boolean, optional) - Включить предпросмотр XML (по умолчанию false)
- `include_comments` (boolean, optional) - Добавить комментарии в шаблон (по умолчанию true)
- `include_null_checks` (boolean, optional) - Добавить проверки на null (по умолчанию true)

### Response (200 OK)
```json
{
  "success": true,
  "parsed_json": {
    "fields": [
      {
        "id": "surname",
        "path": "$request.surname",
        "type": "string",
        "label": "Фамилия",
        "required": true
      }
    ],
    "total_fields": 24
  },
  "parsed_xsd": {
    "elements": [
      {
        "name": "LastName",
        "path": "LastName",
        "type": "string",
        "required": true
      }
    ],
    "total_elements": 18
  },
  "mappings": [
    {
      "json_field_id": "surname",
      "json_field_path": "$request.surname",
      "json_field_label": "Фамилия",
      "xml_element_name": "LastName",
      "xml_element_path": "LastName",
      "variable_name": "surname",
      "confidence_score": 0.52,
      "is_auto_mapped": true
    }
  ],
  "template": "#set($surname = $request.surname)\n#if($surname)\n  <LastName>$surname</LastName>\n#end",
  "validation": {
    "is_valid": true,
    "errors": [],
    "warnings": [
      {
        "line": null,
        "message": "Variable '$surname' is declared but not used",
        "severity": "warning"
      }
    ]
  },
  "preview": "<?xml version=\"1.0\"?>\n<LastName>Иванов</LastName>",
  "stats": {
    "total_mappings": 24,
    "auto_mapped": 24,
    "manual_mapped": 0,
    "avg_confidence": 0.63,
    "unmapped_json_fields": 6,
    "unmapped_xml_elements": 0
  }
}
```

### Errors
- `400 Bad Request` - Невалидный JSON или XSD
- `500 Internal Server Error` - Ошибка генерации

### Логика (выполняется последовательно)
1. **Парсинг JSON схемы** - извлекает поля и метаданные
2. **Парсинг XSD схемы** - извлекает XML элементы и структуру
3. **Автоматический маппинг** - сопоставляет поля используя алгоритмы:
   - Levenshtein distance (расстояние редактирования)
   - Fuzzy matching (нечёткое сопоставление)
   - Token sort ratio (сравнение токенов)
4. **Генерация VM шаблона** - создаёт Apache Velocity шаблон
5. **Валидация** - проверяет синтаксис Velocity
6. **Предпросмотр** (опционально) - применяет шаблон к test_data

### Время выполнения
- Простая схема (5-10 полей): ~200-300ms
- Средняя схема (15-20 полей): ~500-700ms
- Сложная схема (30+ полей): ~1000-1500ms

---

## Детали алгоритма маппинга

### Шаг 1: Извлечение признаков
```python
# JSON поле
{
  "id": "lastName",
  "label": "Фамилия",
  "description": "Фамилия пользователя"
}

# XML элемент
{
  "name": "FamilyName",
  "documentation": "Family name of the person"
}
```

### Шаг 2: Вычисление scores
```python
# 1. Levenshtein distance
levenshtein("lastName", "FamilyName") → 0.45

# 2. Fuzzy matching (ignoring case)
fuzzy_match("фамилия", "family name") → 0.70

# 3. Token sort ratio
token_sort("Фамилия пользователя", "Family name of the person") → 0.65

# Итоговый score (weighted average)
final_score = (0.45 * 0.3) + (0.70 * 0.4) + (0.65 * 0.3) = 0.61
```

### Шаг 3: Выбор лучшего соответствия
```python
# Для каждого JSON поля находим XML элемент с максимальным score
# Если score > threshold (0.5) → автоматический маппинг
# Если score < threshold → unmapped (требует ручного маппинга)
```

### Шаг 4: Разрешение конфликтов
```python
# Если несколько JSON полей мапятся на один XML элемент:
# - Выбираем пару с максимальным score
# - Остальные помечаем как unmapped
```

---

## Пример сгенерированного VM шаблона

### С комментариями и null checks (по умолчанию)
```velocity
## JSON to XML Transformation Template
## Generated: 2025-10-26T17:44:02Z

## Извлечение переменных из JSON
#set($surname = $request.surname)
#set($name = $request.name)
#set($email = $request.email)

## Генерация XML
<?xml version="1.0" encoding="UTF-8"?>
<Person>
  ## Фамилия
  #if($surname)
  <LastName>$surname</LastName>
  #end
  
  ## Имя
  #if($name)
  <FirstName>$name</FirstName>
  #end
  
  ## Email
  #if($email)
  <Email>$email</Email>
  #end
</Person>
```

### Без комментариев и null checks
```velocity
#set($surname = $request.surname)
#set($name = $request.name)
#set($email = $request.email)

<?xml version="1.0" encoding="UTF-8"?>
<Person>
  <LastName>$surname</LastName>
  <FirstName>$name</FirstName>
  <Email>$email</Email>
</Person>
```

---

## Stats объект

### Структура
```json
{
  "total_mappings": 24,           // Всего маппингов создано
  "auto_mapped": 24,              // Автоматически сопоставлено
  "manual_mapped": 0,             // Вручную (всегда 0 для /complete/generate)
  "avg_confidence": 0.63,         // Средняя уверенность
  "unmapped_json_fields": 6,      // JSON поля без маппинга
  "unmapped_xml_elements": 0      // XML элементы без маппинга
}
```

### Интерпретация
- **avg_confidence < 0.5** - низкое качество маппинга, нужна ручная проверка
- **avg_confidence 0.5-0.7** - среднее качество, рекомендуется проверка
- **avg_confidence > 0.7** - высокое качество, можно использовать без проверки

### Unmapped fields
Поля могут остаться без маппинга по причинам:
- Низкий confidence score (< 0.5)
- Конфликт (несколько полей на один элемент)
- Нет подходящего соответствия

Такие поля требуют ручного маппинга в UI!

---

## Использование из BFF

```python
# BFF Service вызывает
result = await generator_client.complete_generation(
    json_schema_content=json_content,
    xsd_schema_content=xsd_content,
    test_data=test_data,
    include_preview=True,
    include_comments=True,
    include_null_checks=True
)

# Сохраняет маппинги в projects-service
await projects_service.bulk_create_mappings(
    project_id, 
    result["mappings"]
)

# Сохраняет шаблон в files-service
await files_service.upload_file_content(
    project_id=project_id,
    file_name="generated_template.vm",
    file_content=result["template"].encode('utf-8'),
    file_type="VM_TEMPLATE"
)
```

