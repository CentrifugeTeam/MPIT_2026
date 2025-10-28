# Projects API Routes

Эндпоинты для управления проектами.

## POST /projects/

Создать новый проект.

### Request
```json
{
  "name": "Регистрация ИП",
  "description": "Преобразование данных для госуслуг"
}
```

### Headers
```
created_by: user@example.com  // опционально, передаётся через BFF
```

### Response (201 Created)
```json
{
  "id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "name": "Регистрация ИП",
  "description": "Преобразование данных для госуслуг",
  "status": "DRAFT",
  "created_by": "user@example.com",
  "created_at": "2025-10-26T16:20:48.821649Z",
  "updated_at": null
}
```

### Логика
1. Создаёт проект со статусом `DRAFT`
2. Сохраняет `created_by` (email)
3. Создаёт запись в `project_history` с действием `CREATED`

---

## GET /projects/

Получить список проектов с фильтрацией.

### Query Parameters
- `created_by` (string) - Фильтр по email создателя
- `status` (enum) - Фильтр по статусу (DRAFT, IN_PROGRESS, COMPLETED, ARCHIVED)
- `skip` (int) - Offset для пагинации (по умолчанию 0)
- `limit` (int) - Лимит записей (по умолчанию 100, max 1000)

### Response (200 OK)
```json
{
  "projects": [
    {
      "id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
      "name": "Регистрация ИП",
      "description": "Преобразование данных",
      "status": "COMPLETED",
      "created_by": "user@example.com",
      "created_at": "2025-10-26T16:20:48Z",
      "updated_at": "2025-10-26T17:30:00Z"
    }
  ],
  "total": 1
}
```

### Логика
1. Применяет фильтры по `created_by` и `status` (если указаны)
2. Возвращает проекты с пагинацией
3. Подсчитывает общее количество

---

## GET /projects/{project_id}

Получить детальную информацию о проекте.

### Response (200 OK)
```json
{
  "id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "name": "Регистрация ИП",
  "description": "Преобразование данных",
  "status": "COMPLETED",
  "created_by": "user@example.com",
  "created_at": "2025-10-26T16:20:48Z",
  "updated_at": "2025-10-26T17:30:00Z",
  "mappings": [
    {
      "id": "205a8a53-db8b-4688-bf12-39a4bc1c97e3",
      "json_field_id": "surname",
      "json_field_path": "$request.surname",
      "json_field_label": "Фамилия",
      "xml_element_name": "LastName",
      "xml_element_path": "LastName",
      "variable_name": "surname",
      "is_auto_mapped": true,
      "confidence_score": 0.52
    }
  ],
  "history": [
    {
      "id": "ffffe78c-5081-4a61-8c09-f7da3485247c",
      "action": "CREATED",
      "user_id": "user@example.com",
      "description": "Project 'Регистрация ИП' created",
      "timestamp": "2025-10-26T16:20:48Z"
    }
  ],
  "files": [
    {
      "id": "7fee7422-0082-4c68-a6f1-1bc51069cc4e",
      "file_name": "json_schema.json",
      "file_type": "JSON_SCHEMA",
      "file_size": 1234,
      "created_at": "2025-10-26T16:22:39Z"
    }
  ]
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Получает проект по ID
2. Загружает связанные маппинги
3. Загружает историю изменений
4. Запрашивает список файлов из files-service
5. Возвращает полную информацию

---

## PUT /projects/{project_id}

Обновить проект.

### Request
```json
{
  "name": "Регистрация ИП (обновлено)",
  "description": "Новое описание",
  "status": "IN_PROGRESS"
}
```

### Response (200 OK)
```json
{
  "id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "name": "Регистрация ИП (обновлено)",
  "description": "Новое описание",
  "status": "IN_PROGRESS",
  "created_by": "user@example.com",
  "created_at": "2025-10-26T16:20:48Z",
  "updated_at": "2025-10-26T18:00:00Z"
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Находит проект по ID
2. Сохраняет старые значения
3. Обновляет указанные поля
4. Обновляет `updated_at`
5. Создаёт запись в `project_history` с действием `UPDATED` и детальными изменениями
6. Возвращает обновлённый проект

---

## DELETE /projects/{project_id}

Удалить проект (каскадное удаление маппингов и истории).

### Response (200 OK)
```json
{
  "message": "Project deleted successfully"
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Находит проект по ID
2. Удаляет проект (CASCADE удалит все маппинги и историю)
3. **Не удаляет файлы** из files-service (нужно делать отдельно)
4. Возвращает подтверждение

---

## GET /projects/{project_id}/mappings

Получить все маппинги проекта.

### Response (200 OK)
```json
{
  "mappings": [
    {
      "id": "205a8a53-db8b-4688-bf12-39a4bc1c97e3",
      "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
      "json_field_id": "surname",
      "json_field_path": "$request.surname",
      "json_field_label": "Фамилия",
      "xml_element_name": "LastName",
      "xml_element_path": "LastName",
      "variable_name": "surname",
      "is_auto_mapped": true,
      "confidence_score": 0.52,
      "created_at": "2025-10-26T17:44:02Z",
      "updated_at": null
    }
  ],
  "total": 24
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Проверяет существование проекта
2. Получает все маппинги проекта
3. Возвращает список + количество

---

## POST /projects/{project_id}/mappings/bulk

Массовое создание маппингов (используется generator-service).

### Request
```json
{
  "mappings": [
    {
      "json_field_id": "surname",
      "json_field_path": "$request.surname",
      "json_field_label": "Фамилия",
      "xml_element_name": "LastName",
      "xml_element_path": "LastName",
      "variable_name": "surname",
      "is_auto_mapped": true,
      "confidence_score": 0.52
    },
    ...
  ]
}
```

### Response (201 Created)
```json
{
  "message": "24 mappings created successfully",
  "mappings": [...]
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Проверяет существование проекта
2. Создаёт все маппинги за один раз (bulk insert)
3. Создаёт запись в `project_history` с действием `MAPPINGS_CREATED`
4. Возвращает созданные маппинги

---

## GET /projects/{project_id}/history

Получить историю изменений проекта.

### Response (200 OK)
```json
{
  "history": [
    {
      "id": "bfaf4de0-3e02-4d62-91ad-4b27fccd8567",
      "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
      "action": "UPDATED",
      "user_id": null,
      "changes": {
        "status": {
          "old": "DRAFT",
          "new": "COMPLETED"
        }
      },
      "description": "Project updated: status",
      "timestamp": "2025-10-26T17:44:02Z"
    }
  ],
  "total": 3
}
```

### Errors
- `404 Not Found` - Проект не найден

### Логика
1. Проверяет существование проекта
2. Получает историю, отсортированную по `timestamp DESC`
3. Возвращает список событий

