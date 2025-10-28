# Auth API Routes

Эндпоинты для аутентификации и управления сессиями.

## POST /auth/login

Вход в систему с получением JWT токенов.

### Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 1800,
  "user_uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b"
}
```

### Errors
- `401 Unauthorized` - Неверные credentials
- `400 Bad Request` - Пользователь неактивен

### Логика
1. Проверяет email/password через `user_crud.authenticate_user()`
2. Проверяет `is_active` флаг
3. Создаёт `access_token` (TTL: 30 минут)
4. Создаёт `refresh_token` (TTL: 7 дней)
5. Сохраняет `refresh_token` в БД
6. Возвращает оба токена

---

## POST /auth/refresh

Обновление access токена используя refresh токен.

### Request
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 1800,
  "user_uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b"
}
```

### Errors
- `401 Unauthorized` - Невалидный refresh токен или пользователь не найден

### Логика
1. Проверяет наличие `refresh_token` в БД
2. Получает пользователя по `user_uuid` из токена
3. Проверяет `is_active` флаг
4. Создаёт новый `access_token`
5. Возвращает новый `access_token` и старый `refresh_token`

---

## POST /auth/logout

Выход из системы (отзыв refresh токена).

### Request
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 OK)
```json
{
  "message": "Successfully logged out"
}
```

### Errors
- `400 Bad Request` - Невалидный refresh токен

### Логика
1. Удаляет `refresh_token` из БД через `refresh_token_crud.revoke_token()`
2. Access токен остаётся валидным до истечения TTL

---

## GET /auth/me

Получить информацию о текущем пользователе.

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
- `401 Unauthorized` - Невалидный или отсутствующий токен

### Логика
1. Извлекает UUID пользователя из JWT токена
2. Получает полную информацию из БД
3. Возвращает профиль пользователя

---

## PUT /auth/me

Обновить профиль текущего пользователя.

### Headers
```
Authorization: Bearer <access_token>
```

### Request
```json
{
  "full_name": "John Doe Updated",
  "password": "newpassword123"  // опционально
}
```

### Response (200 OK)
```json
{
  "uuid": "a3408d70-7172-4b60-bf4f-765a50cfba0b",
  "email": "user@example.com",
  "full_name": "John Doe Updated",
  "role": "USER",
  "is_active": true,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": "2025-10-26T15:30:00Z"
}
```

### Errors
- `401 Unauthorized` - Невалидный токен

### Логика
1. Извлекает UUID из JWT
2. Обновляет `full_name` и/или `password` (если указан)
3. Обновляет `updated_at` timestamp
4. Возвращает обновлённый профиль

