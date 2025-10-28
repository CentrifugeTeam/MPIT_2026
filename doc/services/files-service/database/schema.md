# Files Service Database Schema

## Таблица: `files`

Хранит метаданные файлов проектов.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор файла | PRIMARY KEY, AUTO |
| `project_id` | UUID | ID проекта (из projects-service) | NOT NULL, INDEX |
| `file_name` | String | Оригинальное имя файла | NOT NULL |
| `file_type` | Enum(FileType) | Тип файла | NOT NULL |
| `file_path` | String | Путь к файлу на диске | NOT NULL, UNIQUE |
| `file_size` | BigInteger | Размер файла в байтах | NOT NULL |
| `mime_type` | String | MIME тип файла | NOT NULL |
| `checksum` | String | MD5 хеш для проверки целостности | NOT NULL |
| `uploaded_by` | UUID | UUID пользователя (из auth-service) | NULL |
| `created_at` | DateTime(TZ) | Дата загрузки | NOT NULL, AUTO |
| `updated_at` | DateTime(TZ) | Дата обновления | AUTO (on update) |

### Enum: `FileType`
- `JSON_SCHEMA` - JSON схема исходных данных
- `XSD_SCHEMA` - XSD схема целевого XML
- `TEST_DATA` - Тестовые данные для предпросмотра
- `VM_TEMPLATE` - Сгенерированный Velocity шаблон

### Индексы
- `project_id` - для быстрого получения файлов проекта
- `file_path` - уникальный индекс для проверки дубликатов

### Пример записи
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
  "created_at": "2025-10-26T17:44:01.767827Z",
  "updated_at": null
}
```

### Связи
- **project_id** → логическая связь с `projects.id` в projects-service (нет FK!)
- **uploaded_by** → логическая связь с `users.uuid` в auth-service (нет FK!)

**Почему нет Foreign Keys?**
- Файлы и проекты живут в разных сервисах
- Нет прямой связи на уровне БД (микросервисная архитектура)
- Связь поддерживается на уровне приложения

---

## Хранение файлов на диске

### Структура директорий
```
/app/storage/
├── {project_id_1}/
│   ├── {file_id_1}.json    # JSON_SCHEMA
│   ├── {file_id_2}.xsd     # XSD_SCHEMA
│   ├── {file_id_3}.json    # TEST_DATA
│   └── {file_id_4}.vm      # VM_TEMPLATE
├── {project_id_2}/
│   └── ...
└── {project_id_3}/
    └── ...
```

### Алгоритм генерации пути
```python
def generate_file_path(project_id: UUID, file_id: UUID, file_name: str) -> str:
    extension = file_name.split('.')[-1]
    return f"/app/storage/{project_id}/{file_id}.{extension}"
```

### Пример
```
Исходное имя: "json_schema.json"
Project ID: 5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b
File ID: 7fee7422-0082-4c68-a6f1-1bc51069cc4e

Результат: 
/app/storage/5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b/7fee7422-0082-4c68-a6f1-1bc51069cc4e.json
```

---

## Миграции

### Начальная миграция
```sql
CREATE TYPE file_type AS ENUM ('JSON_SCHEMA', 'XSD_SCHEMA', 'TEST_DATA', 'VM_TEMPLATE');

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    file_name VARCHAR NOT NULL,
    file_type file_type NOT NULL,
    file_path VARCHAR NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR NOT NULL,
    checksum VARCHAR NOT NULL,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_file_path ON files(file_path);
```

---

## Запросы для мониторинга

### Общее количество файлов
```sql
SELECT COUNT(*) FROM files;
```

### Файлы по типам
```sql
SELECT file_type, COUNT(*) 
FROM files 
GROUP BY file_type;
```

### Общий размер хранилища
```sql
SELECT pg_size_pretty(SUM(file_size)) as total_size
FROM files;
```

### Топ-10 самых больших файлов
```sql
SELECT file_name, pg_size_pretty(file_size) as size, file_type
FROM files
ORDER BY file_size DESC
LIMIT 10;
```

### Файлы без проекта (orphaned files)
```sql
-- Требует доступ к projects-service БД
SELECT f.id, f.file_name, f.project_id
FROM files f
LEFT JOIN projects p ON f.project_id = p.id
WHERE p.id IS NULL;
```

### Средний размер файлов по типам
```sql
SELECT file_type, pg_size_pretty(AVG(file_size)::bigint) as avg_size
FROM files
GROUP BY file_type;
```

---

## Cleanup и обслуживание

### Удаление файлов удалённых проектов
```bash
# Скрипт должен:
# 1. Получить список project_id из files
# 2. Проверить существование проектов в projects-service
# 3. Удалить файлы несуществующих проектов

# Псевдокод:
for project_id in (SELECT DISTINCT project_id FROM files):
    if not exists_in_projects_service(project_id):
        delete_files_and_cleanup(project_id)
```

### Проверка целостности файлов
```python
# Проверка MD5 checksum
def verify_file_integrity(file_id):
    db_file = get_file_from_db(file_id)
    actual_checksum = calculate_md5(db_file.file_path)
    return actual_checksum == db_file.checksum
```

### Удаление старых файлов
```sql
-- Файлы старше 1 года (если проект ARCHIVED)
-- Требует интеграцию с projects-service
DELETE FROM files
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE status = 'ARCHIVED' 
    AND updated_at < NOW() - INTERVAL '1 year'
);
```

---

## Конфигурация

### Переменные окружения
```env
STORAGE_PATH=/app/storage          # Путь к хранилищу
MAX_FILE_SIZE=104857600            # 100 MB
ALLOWED_EXTENSIONS=json,xsd,vm,txt
```

### Ограничения
- Максимальный размер файла: **100 MB** (можно изменить)
- Разрешённые расширения: **json, xsd, vm, txt**
- Автоматическое создание директорий для новых проектов

---

## Безопасность

### Реализовано
- ✅ UUID для имён файлов (невозможно угадать)
- ✅ MD5 checksum для проверки целостности
- ✅ Валидация MIME types
- ✅ Ограничение размера файлов
- ✅ Изоляция файлов по проектам (отдельные директории)

### Рекомендации
- 🔒 Добавить антивирус сканирование
- 🔒 Проверка содержимого файлов (не только расширения)
- 🔒 Rate limiting на загрузку
- 🔒 Quota на проект/пользователя
- 🔒 Регулярные бэкапы `/app/storage`

