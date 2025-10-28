# Field Mappings API Routes

Эндпоинты для управления маппингами полей между JSON и XML.

## POST /projects/mappings

Создать новый маппинг.

### Request
```json
{
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "json_field_id": "email",
  "json_field_path": "$request.email",
  "json_field_label": "Электронная почта",
  "xml_element_name": "Email",
  "xml_element_path": "Email",
  "variable_name": "email",
  "is_auto_mapped": false,
  "confidence_score": null
}
```

### Response (201 Created)
```json
{
  "id": "11245c2b-1fec-4466-92fe-44824b2802cd",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "json_field_id": "email",
  "json_field_path": "$request.email",
  "json_field_label": "Электронная почта",
  "xml_element_name": "Email",
  "xml_element_path": "Email",
  "variable_name": "email",
  "is_auto_mapped": false,
  "confidence_score": null,
  "created_at": "2025-10-26T18:00:00Z",
  "updated_at": null
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Проверяет существование проекта
2. Создаёт новый маппинг
3. Создаёт запись в `project_history` с действием `MAPPING_CREATED`
4. Возвращает созданный маппинг

---

## GET /projects/mappings/{mapping_id}

Получить детальную информацию о маппинге.

### Response (200 OK)
```json
{
  "id": "11245c2b-1fec-4466-92fe-44824b2802cd",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "json_field_id": "email",
  "json_field_path": "$request.email",
  "json_field_label": "Электронная почта",
  "xml_element_name": "Email",
  "xml_element_path": "Email",
  "variable_name": "email",
  "is_auto_mapped": false,
  "confidence_score": null,
  "created_at": "2025-10-26T18:00:00Z",
  "updated_at": null
}
```

### Errors
- `404 Not Found` - Маппинг не найден

---

## PUT /projects/mappings/{mapping_id}

Обновить маппинг.

### Request
```json
{
  "xml_element_name": "EmailAddress",
  "xml_element_path": "Contact/EmailAddress",
  "confidence_score": 0.95
}
```

### Response (200 OK)
```json
{
  "id": "11245c2b-1fec-4466-92fe-44824b2802cd",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "json_field_id": "email",
  "json_field_path": "$request.email",
  "json_field_label": "Электронная почта",
  "xml_element_name": "EmailAddress",
  "xml_element_path": "Contact/EmailAddress",
  "variable_name": "email",
  "is_auto_mapped": false,
  "confidence_score": 0.95,
  "created_at": "2025-10-26T18:00:00Z",
  "updated_at": "2025-10-26T19:00:00Z"
}
```

### Errors
- `404 Not Found` - Маппинг не найден

### Логика
1. Находит маппинг по ID
2. Сохраняет старые значения
3. Обновляет указанные поля
4. Обновляет `updated_at`
5. Создаёт запись в `project_history` с действием `MAPPING_UPDATED`
6. Возвращает обновлённый маппинг

---

## DELETE /projects/mappings/{mapping_id}

Удалить маппинг.

### Response (200 OK)
```json
{
  "message": "Mapping deleted successfully"
}
```

### Errors
- `404 Not Found` - Маппинг не найден

### Логика
1. Находит маппинг по ID
2. Удаляет маппинг
3. Создаёт запись в `project_history` с действием `MAPPING_DELETED`
4. Возвращает подтверждение

---

## Поля маппинга

### JSON поля
- `json_field_id` - ID поля в JSON схеме (например: "lastName")
- `json_field_path` - JSONPath к полю (например: "$request.lastName")
- `json_field_label` - Человеко-читаемое название (например: "Фамилия")

### XML поля
- `xml_element_name` - Название элемента в XSD (например: "FamilyName")
- `xml_element_path` - XPath к элементу (опционально)

### VM поля
- `variable_name` - Имя переменной в Velocity шаблоне (например: "lastName")

### Метаданные
- `is_auto_mapped` - Автоматически сопоставлено (true) или вручную (false)
- `confidence_score` - Уверенность алгоритма (0.0 - 1.0)

### Пример использования в VM шаблоне
```velocity
#set($lastName = $request.lastName)  ## json_field_path
<FamilyName>$lastName</FamilyName>   ## xml_element_name
```

