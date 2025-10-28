# Projects Service Database Schema

## Таблица: `projects`

Хранит информацию о проектах преобразования данных.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор проекта | PRIMARY KEY, AUTO |
| `name` | String | Название услуги/проекта | NOT NULL |
| `description` | Text | Описание проекта | NULL |
| `status` | Enum(ProjectStatus) | Статус проекта | NOT NULL, DEFAULT 'DRAFT' |
| `created_by` | String | Email создателя | NULL |
| `created_at` | DateTime(TZ) | Дата создания | NOT NULL, AUTO |
| `updated_at` | DateTime(TZ) | Дата обновления | AUTO (on update) |

### Enum: `ProjectStatus`
- `DRAFT` - черновик (начальный статус)
- `IN_PROGRESS` - в работе
- `COMPLETED` - завершён (VM шаблон создан)
- `ARCHIVED` - архивирован

### Пример записи
```json
{
  "id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "name": "Регистрация ИП",
  "description": "Преобразование данных для госуслуг",
  "status": "COMPLETED",
  "created_by": "user@example.com",
  "created_at": "2025-10-26T16:20:48Z",
  "updated_at": "2025-10-26T17:44:02Z"
}
```

### Связи
- `mappings` - ONE-TO-MANY с `field_mappings`
- `history` - ONE-TO-MANY с `project_history`

---

## Таблица: `field_mappings`

Хранит сопоставления полей между JSON и XML схемами.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор маппинга | PRIMARY KEY, AUTO |
| `project_id` | UUID | ID проекта | NOT NULL, FK → projects(id) |
| **JSON поля** |
| `json_field_id` | String | ID поля в JSON схеме | NOT NULL |
| `json_field_path` | String | JSONPath к полю | NOT NULL |
| `json_field_label` | String | Человеко-читаемое название | NULL |
| **XML поля** |
| `xml_element_name` | String | Название XML элемента | NOT NULL |
| `xml_element_path` | String | XPath к элементу | NULL |
| **VM поля** |
| `variable_name` | String | Имя переменной в VM шаблоне | NOT NULL |
| **Метаданные** |
| `is_auto_mapped` | Boolean | Автоматический маппинг? | NOT NULL, DEFAULT true |
| `confidence_score` | Float | Уверенность алгоритма (0-1) | NULL |
| `created_at` | DateTime(TZ) | Дата создания | NOT NULL, AUTO |
| `updated_at` | DateTime(TZ) | Дата обновления | AUTO (on update) |

### Foreign Keys
- `project_id` → `projects(id)` ON DELETE CASCADE

### Индексы
- `project_id` - для быстрого получения маппингов проекта
- `json_field_id` + `project_id` - уникальность маппинга

### Пример записи
```json
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
```

### Использование в VM шаблоне
```velocity
## Автоматически генерируется из маппинга:
#set($surname = $request.surname)  ## json_field_path
#if($surname)                       ## null check
  <LastName>$surname</LastName>    ## xml_element_name
#end
```

---

## Таблица: `project_history`

Хранит историю изменений проекта (audit log).

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор записи | PRIMARY KEY, AUTO |
| `project_id` | UUID | ID проекта | NOT NULL, FK → projects(id) |
| `action` | String | Тип действия | NOT NULL |
| `user_id` | String | Email пользователя | NULL |
| `changes` | JSON | Детальные изменения | NULL |
| `description` | Text | Человеко-читаемое описание | NULL |
| `timestamp` | DateTime(TZ) | Когда произошло | NOT NULL, AUTO |

### Foreign Keys
- `project_id` → `projects(id)` ON DELETE CASCADE

### Индексы
- `project_id` + `timestamp DESC` - для быстрого получения истории

### Типы действий (`action`)
- `CREATED` - проект создан
- `UPDATED` - проект обновлён
- `MAPPING_CREATED` - создан маппинг
- `MAPPING_UPDATED` - обновлён маппинг
- `MAPPING_DELETED` - удалён маппинг
- `MAPPINGS_CREATED` - массовое создание маппингов
- `GENERATED` - VM шаблон сгенерирован
- `STATUS_CHANGED` - изменён статус

### Пример записи (UPDATED)
```json
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
```

### Пример записи (MAPPINGS_CREATED)
```json
{
  "id": "be9b59ca-1317-4de3-8268-34a61bbdf895",
  "project_id": "5929f4ea-0fcb-4ff7-8e1a-02bc67f0ea5b",
  "action": "MAPPINGS_CREATED",
  "user_id": null,
  "changes": null,
  "description": "Bulk created 24 field mappings",
  "timestamp": "2025-10-26T17:44:02Z"
}
```

---

## Связи между таблицами

```
projects (1) ----< field_mappings (N)
   |
   |
   +-------------< project_history (N)
```

### Каскадное удаление
При удалении проекта автоматически удаляются:
- Все маппинги (`field_mappings`)
- Вся история (`project_history`)

**Файлы НЕ удаляются** - они хранятся в `files-service` и должны удаляться отдельно.

---

## Миграции

### Начальная миграция
```sql
CREATE TYPE project_status AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE field_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    json_field_id VARCHAR NOT NULL,
    json_field_path VARCHAR NOT NULL,
    json_field_label VARCHAR,
    xml_element_name VARCHAR NOT NULL,
    xml_element_path VARCHAR,
    variable_name VARCHAR NOT NULL,
    is_auto_mapped BOOLEAN NOT NULL DEFAULT true,
    confidence_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_field_mappings_project_id ON field_mappings(project_id);

CREATE TABLE project_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    action VARCHAR NOT NULL,
    user_id VARCHAR,
    changes JSON,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_project_history_project_id_timestamp 
ON project_history(project_id, timestamp DESC);
```

---

## Запросы для мониторинга

### Статистика по проектам
```sql
SELECT status, COUNT(*) 
FROM projects 
GROUP BY status;
```

### Топ создателей проектов
```sql
SELECT created_by, COUNT(*) as project_count
FROM projects
WHERE created_by IS NOT NULL
GROUP BY created_by
ORDER BY project_count DESC
LIMIT 10;
```

### Средний confidence score маппингов
```sql
SELECT AVG(confidence_score) as avg_confidence
FROM field_mappings
WHERE is_auto_mapped = true;
```

### Проекты без маппингов
```sql
SELECT p.id, p.name
FROM projects p
LEFT JOIN field_mappings fm ON p.id = fm.project_id
WHERE fm.id IS NULL;
```

### История активности за день
```sql
SELECT action, COUNT(*)
FROM project_history
WHERE timestamp > NOW() - INTERVAL '1 day'
GROUP BY action;
```

