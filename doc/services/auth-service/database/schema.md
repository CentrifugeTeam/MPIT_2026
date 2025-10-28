# Auth Service Database Schema

## Таблица: `users`

Хранит информацию о пользователях системы.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `uuid` | UUID | Уникальный идентификатор пользователя | PRIMARY KEY, AUTO |
| `email` | String | Email пользователя | UNIQUE, NOT NULL, INDEX |
| `password_hash` | String | Хеш пароля (bcrypt) | NOT NULL |
| `role` | Enum(UserRole) | Роль пользователя | NOT NULL, DEFAULT 'USER' |
| `is_active` | Boolean | Активен ли пользователь | NOT NULL, DEFAULT true |
| `is_verified` | Boolean | Подтверждён ли email | NOT NULL, DEFAULT false |
| `created_at` | DateTime(TZ) | Дата создания | NOT NULL, AUTO |
| `updated_at` | DateTime(TZ) | Дата обновления | AUTO (on update) |

### Enum: `UserRole`
- `USER` - обычный пользователь
- `ADMIN` - администратор системы

### Индексы
- `email` - уникальный индекс для быстрого поиска по email

### Пример записи
```json
{
  "uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "email": "user@example.com",
  "password_hash": "$2b$12$...",
  "role": "USER",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": null
}
```

### Связи
- Нет прямых foreign keys
- Связан логически с таблицами в других сервисах по `email` или `uuid`

---

## Таблица: `refresh_tokens`

Хранит refresh токены для продления сессий.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор токена | PRIMARY KEY, AUTO |
| `user_uuid` | UUID | UUID пользователя | NOT NULL |
| `token_hash` | String | Хеш refresh токена | NOT NULL |
| `expires_at` | DateTime(TZ) | Когда истекает токен | NOT NULL |
| `created_at` | DateTime(TZ) | Дата создания токена | NOT NULL, AUTO |
| `is_revoked` | Boolean | Отозван ли токен | NOT NULL, DEFAULT false |

### Индексы
- `user_uuid` - для быстрого поиска токенов пользователя
- `token_hash` - для проверки валидности токена

### Пример записи
```json
{
  "id": "b1234567-1234-1234-1234-123456789abc",
  "user_uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "token_hash": "hash_of_refresh_token",
  "expires_at": "2025-11-02T10:00:00Z",
  "created_at": "2025-10-26T10:00:00Z",
  "is_revoked": false
}
```

### Логика работы
1. При login создаётся refresh токен и сохраняется в БД
2. При refresh проверяется наличие токена в БД
3. При logout токен помечается `is_revoked = true`
4. Истёкшие токены периодически удаляются (cleanup job)

---

## Миграции

### Начальная миграция
```sql
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

CREATE TABLE users (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_uuid UUID NOT NULL,
    token_hash VARCHAR NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_refresh_tokens_user_uuid ON refresh_tokens(user_uuid);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

---

## Запросы для мониторинга

### Количество пользователей
```sql
SELECT COUNT(*) FROM users WHERE is_active = true;
```

### Количество админов
```sql
SELECT COUNT(*) FROM users WHERE role = 'ADMIN';
```

### Активные refresh токены
```sql
SELECT COUNT(*) FROM refresh_tokens 
WHERE is_revoked = false AND expires_at > NOW();
```

### Истёкшие токены (для cleanup)
```sql
DELETE FROM refresh_tokens 
WHERE expires_at < NOW() - INTERVAL '30 days';
```

