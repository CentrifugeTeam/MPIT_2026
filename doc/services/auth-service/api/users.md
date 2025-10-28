# Users API Routes

Эндпоинты для управления пользователями (только для ADMIN).

## POST /auth/register

Регистрация нового пользователя.

### Request
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "USER"  // опционально, по умолчанию USER
}
```

### Response (201 Created)
```json
{
  "uuid": "b1234567-1234-1234-1234-123456789abc",
  "email": "newuser@example.com",
  "full_name": "John Doe",
  "role": "USER",
  "is_active": true,
  "created_at": "2025-10-26T15:00:00Z",
  "updated_at": null
}
```

### Errors
- `400 Bad Request` - Email уже существует
- `422 Unprocessable Entity` - Невалидные данные

### Логика
1. Проверяет уникальность email
2. Хеширует пароль с помощью bcrypt
3. Создаёт запись в таблице `users`
4. По умолчанию `is_active = true`, `role = USER`
5. Возвращает созданного пользователя

---

## GET /users

Получить список всех пользователей.

**Требуется роль: ADMIN**

### Headers
```
Authorization: Bearer <access_token>
```

### Query Parameters
- `skip` (int) - Offset для пагинации (по умолчанию 0)
- `limit` (int) - Количество записей (по умолчанию 100)

### Response (200 OK)
```json
{
  "users": [
    {
      "uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "USER",
      "is_active": true,
      "created_at": "2025-10-26T10:00:00Z",
      "updated_at": null
    },
    ...
  ],
  "total": 42
}
```

### Errors
- `401 Unauthorized` - Невалидный токен
- `403 Forbidden` - Недостаточно прав (не ADMIN)

### Логика
1. Проверяет роль пользователя из JWT (`role == ADMIN`)
2. Получает список пользователей с пагинацией
3. Возвращает список + общее количество

---

## GET /users/{user_uuid}

Получить информацию о конкретном пользователе.

**Требуется роль: ADMIN**

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "email": "user@example.com",
  "full_name": "John Doe",
  "role": "USER",
  "is_active": true,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": null
}
```

### Errors
- `401 Unauthorized` - Невалидный токен
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Пользователь не найден

### Логика
1. Проверяет роль ADMIN
2. Получает пользователя по UUID
3. Возвращает полную информацию

---

## PUT /users/{user_uuid}

Обновить пользователя.

**Требуется роль: ADMIN**

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "full_name": "John Doe Updated",
  "role": "ADMIN",
  "is_active": false,
  "password": "newpassword123"  // опционально
}
```

### Response (200 OK)
```json
{
  "uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "email": "user@example.com",
  "full_name": "John Doe Updated",
  "role": "ADMIN",
  "is_active": false,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": "2025-10-26T16:00:00Z"
}
```

### Errors
- `401 Unauthorized` - Невалидный токен
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Пользователь не найден

### Логика
1. Проверяет роль ADMIN
2. Обновляет указанные поля
3. Если указан `password` - хеширует и обновляет
4. Обновляет `updated_at`
5. Возвращает обновлённого пользователя

---

## DELETE /users/{user_uuid}

Удалить пользователя (soft delete - is_active = false).

**Требуется роль: ADMIN**

### Headers
```
Authorization: Bearer <access_token>
```

### Response (200 OK)
```json
{
  "message": "User deleted successfully"
}
```

### Errors
- `401 Unauthorized` - Невалидный токен
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Пользователь не найден

### Логика
1. Проверяет роль ADMIN
2. Устанавливает `is_active = false`
3. Не удаляет физически из БД (soft delete)
4. Возвращает подтверждение

