# Services Documentation

Детальная документация по всем сервисам системы.

---

## Структура документации

Каждый сервис имеет следующую структуру:
- **api/** - описание API endpoints (что за что отвечает, параметры, ответы, логика)
- **database/** - структура базы данных (таблицы, связи, индексы, миграции)

---

## Auth Service

**Описание:** Аутентификация и управление пользователями (JWT токены, роли, профили).

### API Routes
- [auth.md](./auth-service/api/auth.md) - Login, Refresh, Logout, Get Me
- [users.md](./auth-service/api/users.md) - Register, CRUD пользователей (Admin only)

### Database
- [schema.md](./auth-service/database/schema.md) - Таблицы: `users`, `refresh_tokens`

---

## BFF Service

**Описание:** API Gateway, оркестрация запросов между сервисами, аггрегация данных.

### Особенности
- Stateless (нет БД)
- Единая точка входа для frontend
- Оркестрирует запросы к auth, projects, files, generator, notification сервисам

**Важно:** BFF проксирует и комбинирует запросы. Детальное описание endpoints каждого сервиса см. в соответствующих разделах.

---

## Projects Service

**Описание:** Управление проектами и field mappings между JSON и XML схемами.

### API Routes
- [projects.md](./projects-service/api/projects.md) - CRUD проектов, история изменений
- [mappings.md](./projects-service/api/mappings.md) - CRUD field mappings

### Database
- [schema.md](./projects-service/database/schema.md) - Таблицы: `projects`, `field_mappings`, `project_history`

---

## Files Service

**Описание:** Загрузка, хранение и управление файлами (JSON, XSD, test data, VM templates).

### API Routes
- [files.md](./files-service/api/files.md) - Upload, Download, Delete файлов

### Database
- [schema.md](./files-service/database/schema.md) - Таблица: `files`

---

## Generator Service

**Описание:** Парсинг схем, автоматический маппинг, генерация Apache Velocity шаблонов.

### API Routes
- [complete.md](./generator-service/api/complete.md) - Полный цикл генерации (парсинг → маппинг → генерация → валидация)

### Особенности
- **Stateless** (нет БД!)
- Pure computation сервис
- Легко горизонтально масштабируется
- См. [README.md](./generator-service/README.md) для деталей

---

## Notification Service

**Описание:** Отправка email уведомлений через RabbitMQ (асинхронная обработка).

### API Routes
- [notifications.md](./notification-service/api/notifications.md) - Отправка и управление уведомлениями

### Database
- [schema.md](./notification-service/database/schema.md) - Таблицы: `notifications`, `notification_settings`

### Асинхронная обработка
- RabbitMQ очередь: `email_notifications`
- Worker: `email_worker.py`
- Retry механизм (3 попытки)

---

## Frontend

**Описание:** React SPA с TypeScript, Vite, Tailwind CSS.

### Documentation
- [api/README.md](./frontend/api/README.md) - Интеграция с BFF API, примеры запросов
- [structure/README.md](./frontend/structure/README.md) - Структура проекта, роутинг, state management

### Особенности
- Zustand для state management
- React Router v6
- Axios для HTTP запросов
- i18n (ru/en)
- Dark/Light theme

---

## Database Architecture

### Shared PostgreSQL Database

Все сервисы (кроме generator) используют одну БД `project_db`:

**Таблицы:**
- `users` (auth-service)
- `refresh_tokens` (auth-service)
- `projects` (projects-service)
- `field_mappings` (projects-service)
- `project_history` (projects-service)
- `files` (files-service)
- `notifications` (notification-service)
- `notification_settings` (notification-service)

**Важно:** 
- Нет Foreign Keys между сервисами (микросервисная архитектура)
- Связи поддерживаются на уровне приложения
- Каждый сервис отвечает только за свои таблицы

---

## Безопасность

### JWT Authentication
- Access token: 30 минут TTL
- Refresh token: 7 дней TTL
- Хранятся в `localStorage` на frontend
- Передаются в `Authorization: Bearer <token>` header

### Роли пользователей
- `USER` - обычный пользователь (CRUD своих проектов)
- `ADMIN` - администратор (управление пользователями, все проекты)

### HTTPS (Production)
- NGINX reverse proxy с SSL сертификатами
- Let's Encrypt для автоматических сертификатов

---

## Мониторинг

### Логи
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f bff-service

# С временем
docker-compose logs --since 10m bff-service
```

### Health Checks
```bash
# BFF health
curl http://localhost:8000/health

# Все контейнеры
docker-compose ps
```

### RabbitMQ
- Web UI: http://localhost:15672
- Login: guest / guest

---

## Контакты

При возникновении вопросов по документации:
- Создайте Issue в репозитории
- Обратитесь к https://github.com/GermaMirn
