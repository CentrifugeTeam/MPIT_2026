# Notification Service Database Schema

## Таблица: `notifications`

Хранит историю всех уведомлений.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор уведомления | PRIMARY KEY, AUTO |
| `user_id` | String | Email пользователя | NOT NULL, INDEX |
| `type` | Enum(NotificationType) | Тип уведомления | NOT NULL |
| `title` | String | Заголовок | NOT NULL |
| `message` | Text | Текст уведомления | NOT NULL |
| `status` | Enum(NotificationStatus) | Статус отправки | NOT NULL, DEFAULT 'pending' |
| `email` | String | Email для отправки | NULL |
| `created_at` | DateTime(TZ) | Дата создания | NOT NULL, AUTO |
| `sent_at` | DateTime(TZ) | Дата отправки | NULL |
| `error_message` | Text | Сообщение об ошибке | NULL |

### Enum: `NotificationType`
- `registration` - уведомления о регистрации
- `system` - системные уведомления
- `email` - email уведомления

### Enum: `NotificationStatus`
- `pending` - ожидает отправки
- `sent` - отправлено успешно
- `failed` - ошибка отправки

### Индексы
- `user_id` - для быстрого получения уведомлений пользователя
- `status` - для поиска pending/failed уведомлений
- `created_at DESC` - для сортировки по дате

### Пример записи (pending)
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

### Пример записи (sent)
```json
{
  "id": "a1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "type": "email",
  "title": "Проект создан",
  "message": "Ваш проект был успешно создан",
  "status": "sent",
  "email": "user@example.com",
  "created_at": "2025-10-26T18:00:00Z",
  "sent_at": "2025-10-26T18:00:05Z",
  "error_message": null
}
```

### Пример записи (failed)
```json
{
  "id": "b1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "type": "email",
  "title": "Проект завершён",
  "message": "Ваш проект готов",
  "status": "failed",
  "email": "user@example.com",
  "created_at": "2025-10-26T18:00:00Z",
  "sent_at": null,
  "error_message": "SMTP connection refused"
}
```

---

## Таблица: `notification_settings`

Хранит настройки уведомлений пользователей.

### Структура

| Поле | Тип | Описание | Constraints |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор | PRIMARY KEY, AUTO |
| `user_id` | String | Email пользователя | UNIQUE, NOT NULL, INDEX |
| `email_notifications` | Boolean | Email уведомления вкл/выкл | NOT NULL, DEFAULT true |
| `system_notifications` | Boolean | Системные уведомления вкл/выкл | NOT NULL, DEFAULT true |
| `registration_notifications` | Boolean | Регистрационные уведомления вкл/выкл | NOT NULL, DEFAULT true |
| `created_at` | DateTime(TZ) | Дата создания | NOT NULL, AUTO |
| `updated_at` | DateTime(TZ) | Дата обновления | NOT NULL, AUTO (on update) |

### Индексы
- `user_id` - уникальный индекс для быстрого поиска настроек

### Пример записи
```json
{
  "id": "c1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "email_notifications": true,
  "system_notifications": true,
  "registration_notifications": false,
  "created_at": "2025-10-26T10:00:00Z",
  "updated_at": "2025-10-26T18:00:00Z"
}
```

### Логика создания
- Настройки создаются автоматически при первом уведомлении пользователя
- Все уведомления включены по умолчанию
- Пользователь может изменить настройки через API

---

## Миграции

### Начальная миграция
```sql
CREATE TYPE notification_type AS ENUM ('registration', 'system', 'email');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    type notification_type NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    email VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE TABLE notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR UNIQUE NOT NULL,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    system_notifications BOOLEAN NOT NULL DEFAULT true,
    registration_notifications BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);
```

---

## Запросы для мониторинга

### Статистика по статусам
```sql
SELECT status, COUNT(*) 
FROM notifications 
GROUP BY status;
```

### Failed уведомления за последний час
```sql
SELECT id, user_id, title, error_message, created_at
FROM notifications
WHERE status = 'failed' 
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

### Среднее время отправки
```sql
SELECT AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_send_time_seconds
FROM notifications
WHERE status = 'sent' AND sent_at IS NOT NULL;
```

### Pending уведомления (зависли)
```sql
SELECT id, user_id, title, created_at
FROM notifications
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at ASC;
```

### Топ пользователей по количеству уведомлений
```sql
SELECT user_id, COUNT(*) as notification_count
FROM notifications
GROUP BY user_id
ORDER BY notification_count DESC
LIMIT 10;
```

### Статистика по типам
```sql
SELECT type, COUNT(*) as count,
       SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM notifications
GROUP BY type;
```

---

## Cleanup

### Удаление старых уведомлений
```sql
-- Удаляем успешно отправленные уведомления старше 30 дней
DELETE FROM notifications
WHERE status = 'sent' 
  AND sent_at < NOW() - INTERVAL '30 days';

-- Удаляем failed уведомления старше 7 дней
DELETE FROM notifications
WHERE status = 'failed' 
  AND created_at < NOW() - INTERVAL '7 days';
```

### Cleanup job (cron)
```bash
# /etc/cron.daily/cleanup-notifications.sh
#!/bin/bash
psql -h postgres-db -U postgres -d project_db -c "
  DELETE FROM notifications 
  WHERE (status = 'sent' AND sent_at < NOW() - INTERVAL '30 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '7 days');
"
```

---

## RabbitMQ интеграция

### Очередь: `email_notifications`

```json
{
  "notification_id": "a1234567-1234-1234-1234-123456789abc",
  "user_id": "user@example.com",
  "email": "user@example.com",
  "title": "Проект создан",
  "message": "Ваш проект был успешно создан",
  "retry_count": 0
}
```

### Worker обработка

```python
# 1. Получить сообщение из очереди
message = rabbitmq.consume("email_notifications")

# 2. Получить уведомление из БД
notification = db.query(Notification).filter(
    Notification.id == message["notification_id"]
).first()

# 3. Проверить настройки пользователя
settings = db.query(NotificationSettings).filter(
    NotificationSettings.user_id == notification.user_id
).first()

if not settings.email_notifications:
    # Пропустить, если выключено
    return

# 4. Отправить email
try:
    send_email(
        to=notification.email,
        subject=notification.title,
        body=notification.message
    )
    
    # 5. Обновить статус
    notification.status = "sent"
    notification.sent_at = datetime.now()
    db.commit()
    
except Exception as e:
    # 6. Обработать ошибку
    notification.status = "failed"
    notification.error_message = str(e)
    db.commit()
    
    # 7. Retry
    if message["retry_count"] < 3:
        message["retry_count"] += 1
        rabbitmq.publish("email_notifications", message, delay=300)
```

---

## Связи с другими сервисами

- **user_id** → логическая связь с `users.email` в auth-service (нет FK!)
- Уведомления создаются из любого сервиса через BFF
- Worker отправляет email независимо от других сервисов

