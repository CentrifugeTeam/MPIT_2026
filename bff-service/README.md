# BFF Service (Backend For Frontend)

-------------

## Описание

API Gateway сервис, который объединяет все микросервисы и предоставляет единый API для фронтенда. Отвечает за оркестрацию запросов, аггрегацию данных и упрощение взаимодействия клиента с backend.

-------------

## Зачем выделен отдельно?

### 🎯 Основные причины:

1. **Упрощение клиента**
   - Один endpoint вместо 5-7 запросов к разным сервисам
   - Фронтенд не знает о внутренней архитектуре
   - Меньше HTTP запросов = быстрее UI

2. **Оркестрация бизнес-логики**
   - Сложные flow (создание проекта + загрузка файлов + генерация)
   - Аггрегация данных из разных сервисов
   - Обработка ошибок и retry логика

3. **Безопасность**
   - Единая точка входа для аутентификации
   - Скрывает внутренние сервисы от интернета
   - Централизованная валидация и rate limiting

4. **Гибкость**
   - Можно менять внутренние сервисы без изменения клиента
   - Версионирование API
   - A/B тестирование

-------------

## Технологии

- **Framework**: FastAPI (Python 3.11)
- **HTTP Client**: httpx (async)
- **Auth**: JWT validation
- **Async**: asyncio для параллельных запросов

-------------

## Переменные окружения

```env
# Внутренние URL сервисов
AUTH_SERVICE_URL=http://auth-service:8001
PROJECTS_SERVICE_URL=http://projects-service:8002
FILES_SERVICE_URL=http://files-service:8003
GENERATOR_SERVICE_URL=http://generator-service:8004
NOTIFICATION_SERVICE_URL=http://notification-service:8005
WEBSOCKET_SERVICE_URL=http://websocket-service:8006

# JWT конфиг (для валидации)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

-------------

## Взаимодействие с другими сервисами

- **Auth Service** → проверка JWT токенов, получение информации о пользователе
- **Projects Service** → CRUD операции над проектами и маппингами
- **Files Service** → загрузка/скачивание файлов
- **Generator Service** → генерация VM шаблонов
- **Notification Service** → отправка уведомлений
- **WebSocket Service** → real-time коммуникация

