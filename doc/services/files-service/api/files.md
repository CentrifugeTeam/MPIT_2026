# Files API Routes

Эндпоинты для управления файлами проектов.

## POST /files/upload

Загрузить файл в систему.

### Request (multipart/form-data)
```
file: <binary>                           # Файл для загрузки
project_id: "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b"  # UUID проекта
file_type: "JSON_SCHEMA"                 # Тип файла
uploaded_by: "a3408d70-7172-4b60-bf4f-765a50cfba0b"  # UUID пользователя (опционально)
```

### Response (201 Created)
```json
{
  "id": "7fee7422-0082-4c68-a6f1-1bc51069cc4e",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "file_name": "json_schema.json",
  "file_type": "JSON_SCHEMA",
  "file_path": "/app/storage/5929f4ea.../7fee7422....json",
  "file_size": 4265,
  "mime_type": "application/json",
  "checksum": "77d4e5336dc8079ae2ff9b9be42eff27",
  "uploaded_by": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "created_at": "2025-10-26T17:44:01.767827Z"
}
```

### File Types
- `JSON_SCHEMA` - JSON схема исходных данных
- `XSD_SCHEMA` - XSD схема целевого XML
- `TEST_DATA` - Тестовые данные для предпросмотра
- `VM_TEMPLATE` - Сгенерированный Velocity шаблон

### Errors
- `400 Bad Request` - Невалидный UUID или file_type
- `500 Internal Server Error` - Ошибка сохранения файла

### Логика
1. Валидирует `project_id` (UUID)
2. Проверяет `file_type` (должен быть из enum)
3. Генерирует уникальный `file_id` (UUID)
4. Сохраняет файл на диск в `/app/storage/{project_id}/{file_id}.ext`
5. Вычисляет MD5 checksum
6. Определяет MIME type
7. Сохраняет метаданные в БД
8. Возвращает информацию о файле

---

## GET /files/{file_id}/download

Скачать файл по ID.

### Response (200 OK)
Файл в бинарном виде с headers:
```
Content-Type: application/json
Content-Disposition: attachment; filename="json_schema.json"
```

### Errors
- `400 Bad Request` - Невалидный UUID
- `404 Not Found` - Файл не найден в БД или на диске
- `500 Internal Server Error` - Ошибка чтения файла

### Логика
1. Валидирует `file_id` (UUID)
2. Получает метаданные из БД
3. Проверяет существование файла на диске
4. Возвращает файл через `FileResponse`

---

## GET /files/{file_id}

Получить метаданные файла (без скачивания).

### Response (200 OK)
```json
{
  "id": "7fee7422-0082-4c68-a6f1-1bc51069cc4e",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "file_name": "json_schema.json",
  "file_type": "JSON_SCHEMA",
  "file_size": 4265,
  "mime_type": "application/json",
  "created_at": "2025-10-26T17:44:01.767827Z"
}
```

### Errors
- `400 Bad Request` - Невалидный UUID
- `404 Not Found` - Файл не найден

### Логика
1. Валидирует `file_id`
2. Получает метаданные из БД
3. Возвращает информацию о файле (без контента)

---

## GET /files/project/{project_id}

Получить все файлы проекта.

### Query Parameters
- `file_type` (optional) - Фильтр по типу файла

### Response (200 OK)
```json
{
  "files": [
    {
      "id": "7fee7422-0082-4c68-a6f1-1bc51069cc4e",
      "file_name": "json_schema.json",
      "file_type": "JSON_SCHEMA",
      "file_size": 4265,
      "mime_type": "application/json",
      "created_at": "2025-10-26T17:44:01Z"
    },
    {
      "id": "44660619-e224-44bd-a7fc-85b0ec23f24c",
      "file_name": "xsd_schema.xsd",
      "file_type": "XSD_SCHEMA",
      "file_size": 4544,
      "mime_type": "application/octet-stream",
      "created_at": "2025-10-26T17:44:01Z"
    }
  ],
  "total": 2
}
```

### Errors
- `400 Bad Request` - Невалидный UUID проекта

### Логика
1. Валидирует `project_id`
2. Получает все файлы проекта из БД
3. Опционально фильтрует по `file_type`
4. Возвращает список файлов + количество

---

## DELETE /files/{file_id}

Удалить файл (из БД и с диска).

### Response (200 OK)
```json
{
  "message": "File deleted successfully"
}
```

### Errors
- `400 Bad Request` - Невалидный UUID
- `404 Not Found` - Файл не найден
- `500 Internal Server Error` - Ошибка удаления файла с диска

### Логика
1. Валидирует `file_id`
2. Получает метаданные из БД
3. Удаляет файл с диска
4. Удаляет запись из БД
5. Возвращает подтверждение

**Важно:** При удалении проекта файлы НЕ удаляются автоматически!

---

## Хранение файлов

### Структура директорий
```
/app/storage/
└── {project_id}/
    ├── {file_id1}.json    # JSON схема
    ├── {file_id2}.xsd     # XSD схема
    ├── {file_id3}.json    # Test data
    └── {file_id4}.vm      # VM шаблон
```

### Пример пути
```
/app/storage/5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b/7fee7422-0082-4c68-a6f1-1bc51069cc4e.json
```

### Безопасность
- Каждый проект имеет свою директорию
- Файлы именуются по UUID (невозможно угадать)
- MD5 checksum для проверки целостности
- MIME type валидация

---

## Интеграция с другими сервисами

### BFF Service
```python
# Загрузка файла
files_service.upload_file(
    file=upload_file,
    project_id=project_id,
    file_type="JSON_SCHEMA",
    uploaded_by=user_uuid
)

# Скачивание контента
content = files_service.download_file(file_id)
```

### Generator Service
Получает контент файлов через BFF:
```python
json_content = await files_service.download_file(json_file_id)
xsd_content = await files_service.download_file(xsd_file_id)

# Парсинг
parsed_json = json_parser.parse(json_content)
parsed_xsd = xsd_parser.parse(xsd_content)
```

### Projects Service
```python
# Получение списка файлов проекта
files = files_client.get_project_files(project_id)

# Проверка наличия обязательных файлов
json_file = next((f for f in files if f["file_type"] == "JSON_SCHEMA"), None)
xsd_file = next((f for f in files if f["file_type"] == "XSD_SCHEMA"), None)
```

