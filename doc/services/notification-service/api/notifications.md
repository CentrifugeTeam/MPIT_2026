# Notifications API Routes

Эндпоинты для управления уведомлениями.

## POST /notifications/send

Отправить уведомление пользователю.

### Request
```json
{
  "user_id": "user@example.com",
  "type": "email",
  "title": "Проект создан",
  "message": "Ваш проект 'Регистрация ИП' был успешно создан",
  "email": "user@example.com"
}
```

### Parameters
- `user_id` (string, required) - Email или ID пользователя
- `type` (enum, required) - Тип уведомления: `registration`, `system`, `email`
- `title` (string, required) - Заголовок уведомления
- `message` (string, required) - Текст уведомления
- `email` (string, optional) - Email для отправки (если тип `email`)

### Response (201 Created)
```json
{
  "id": "a1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "type": "email",
  "title": "Проект создан",
  "message": "Ваш проект 'Регистрация ИП' был успешно создан",
  "status": "pending",
  "email": "user@example.com",
  "created_at": "2025-10-26T18:00:00Z",
  "sent_at": null,
  "error_message": null
}
```

### Errors
- `400 Bad Request` - Невалидные данные
- `500 Internal Server Error` - Ошибка создания уведомления

### Логика
1. Создаёт уведомление со статусом `pending`
2. Сохраняет в БД
3. Отправляет в RabbitMQ очередь для асинхронной обработки
4. Возвращает созданное уведомление

**Важно:** Email отправляется асинхронно через RabbitMQ worker!

---

## GET /notifications/user/{user_id}

Получить все уведомления пользователя.

### Query Parameters
- `status` (enum, optional) - Фильтр по статусу: `pending`, `sent`, `failed`
- `type` (enum, optional) - Фильтр по типу: `registration`, `system`, `email`
- `skip` (int, optional) - Offset для пагинации (по умолчанию 0)
- `limit` (int, optional) - Лимит записей (по умолчанию 50, max 100)

### Response (200 OK)
```json
{
  "notifications": [
    {
      "id": "a1234567-1234-1234-1234-123456789abc",
      "user_id": "user@example.com",
      "type": "email",
      "title": "Проект создан",
      "message": "Ваш проект был создан",
      "status": "sent",
      "created_at": "2025-10-26T18:00:00Z",
      "sent_at": "2025-10-26T18:00:05Z"
    }
  ],
  "total": 15
}
```

### Логика
1. Получает уведомления пользователя из БД
2. Применяет фильтры по `status` и `type` (если указаны)
3. Применяет пагинацию
4. Возвращает список уведомлений

---

## GET /notifications/{notification_id}

Получить детальную информацию об уведомлении.

### Response (200 OK)
```json
{
  "id": "a1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "type": "email",
  "title": "Проект создан",
  "message": "Ваш проект 'Регистрация ИП' был успешно создан",
  "status": "sent",
  "email": "user@example.com",
  "created_at": "2025-10-26T18:00:00Z",
  "sent_at": "2025-10-26T18:00:05Z",
  "error_message": null
}
```

### Errors
- `400 Bad Request` - Невалидный UUID
- `404 Not Found` - Уведомление не найдено

---

## PUT /notifications/{notification_id}/mark-read

Пометить уведомление как прочитанное (опционально).

### Response (200 OK)
```json
{
  "message": "Notification marked as read"
}
```

### Errors
- `404 Not Found` - Уведомление не найдено

---

## GET /notifications/settings/{user_id}

Получить настройки уведомлений пользователя.

### Response (200 OK)
```json
{
  "id": "b1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "email_notifications": true,
  "system_notifications": true,
  "registration_notifications": false,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": "2025-10-26T18:00:00Z"
}
```

### Errors
- `404 Not Found` - Настройки не найдены (создаются автоматически при первом уведомлении)

---

## PUT /notifications/settings/{user_id}

Обновить настройки уведомлений.

### Request
```json
{
  "email_notifications": false,
  "system_notifications": true,
  "registration_notifications": true
}
```

### Response (200 OK)
```json
{
  "id": "b1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "email_notifications": false,
  "system_notifications": true,
  "registration_notifications": true,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": "2025-10-26T19:00:00Z"
}
```

---

## Асинхронная обработка (RabbitMQ)

### Flow отправки email

```
1. API создаёт уведомление (status: pending)
         ↓
2. Отправляет в RabbitMQ очередь "email_notifications"
         ↓
3. Worker получает задачу из очереди
         ↓
4. Worker отправляет email через SMTP
         ↓
5. Worker обновляет статус в БД:
   - success → status: sent, sent_at: NOW()
   - failure → status: failed, error_message: "..."
```

### Worker (email_worker.py)

```python
while True:
    message = rabbitmq.consume("email_notifications")
    
    notification = get_notification_from_db(message["notification_id"])
    
    try:
        send_email(
            to=notification.email,
            subject=notification.title,
            body=notification.message
        )
        
        update_notification_status(
            notification_id=notification.id,
            status="sent",
            sent_at=datetime.now()
        )
    except Exception as e:
        update_notification_status(
            notification_id=notification.id,
            status="failed",
            error_message=str(e)
        )
        
        # Retry через 5 минут (опционально)
        if retry_count < 3:
            rabbitmq.publish("email_notifications", message, delay=300)
```

### Retry механизм

- Максимум 3 попытки
- Exponential backoff: 5 min, 15 min, 30 min
- После 3 неудач → `status: failed`

---

## Типы уведомлений

### `registration`
Уведомления о регистрации и активации аккаунта.

**Пример:**
```json
{
  "type": "registration",
  "title": "Добро пожаловать!",
  "message": "Ваш аккаунт успешно создан"
}
```

### `system`
Системные уведомления (обновления, обслуживание).

**Пример:**
```json
{
  "type": "system",
  "title": "Плановое обслуживание",
  "message": "Система будет недоступна с 02:00 до 04:00"
}
```

### `email`
Email уведомления о событиях в проектах.

**Пример:**
```json
{
  "type": "email",
  "title": "Проект завершён",
  "message": "Ваш проект 'Регистрация ИП' успешно завершён. VM шаблон готов к использованию."
}
```

---

## Настройки SMTP

### Gmail (для разработки)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Не обычный пароль!
SMTP_FROM=noreply@yourapp.com
```

### Yandex
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=your-email@yandex.ru
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourapp.com
```

### SendGrid / Mailgun (для production)
Рекомендуется использовать специализированные сервисы для надёжной доставки.

---

## Мониторинг

### Проверка очереди RabbitMQ
```bash
# Web UI
http://localhost:15672

# CLI
docker exec rabbitmq rabbitmqctl list_queues
```

### Статистика уведомлений
```sql
-- Количество по статусам
SELECT status, COUNT(*) FROM notifications GROUP BY status;

-- Failed за последний час
SELECT COUNT(*) FROM notifications 
WHERE status = 'failed' AND created_at > NOW() - INTERVAL '1 hour';

-- Средн время отправки
SELECT AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_send_time_seconds
FROM notifications
WHERE status = 'sent';
```

