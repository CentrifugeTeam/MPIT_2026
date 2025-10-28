# JSON to XML Transformation Platform

Платформа для автоматической генерации Apache Velocity шаблонов для трансформации JSON в XML на основе схем данных.

-------------

## Описание проекта

Система предназначена для автоматизации процесса создания шаблонов преобразования данных между форматами JSON и XML.

**Основная задача:** упростить интеграцию с государственными информационными системами (ГИС), которые требуют данные в формате XML, когда исходные данные поступают в JSON.

### Что делает платформа:

1. **Парсинг схем** - анализирует JSON Schema и XSD схемы
2. **Автоматический маппинг** - сопоставляет поля между схемами используя алгоритмы:
   - Levenshtein distance (расстояние редактирования)
   - Fuzzy matching (нечёткое сопоставление)
   - Token sort ratio (сравнение токенов)
3. **Генерация VM шаблонов** - создаёт Apache Velocity шаблоны для трансформации
4. **Валидация** - проверяет корректность сгенерированных шаблонов
5. **Предпросмотр** - показывает результат трансформации на тестовых данных

-------------

## Архитектура

Система построена на микросервисной архитектуре с 6 основными сервисами:

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                    (React + TypeScript)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                  │
│                    Load Balancer + SSL                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                      BFF Service (API Gateway)              │
│              Оркестрация запросов + Аггрегация              │
└─────┬─────────────┬─────────┬──────────────┬─────────────┬──┘
      │             │         │              │             │
      ↓             ↓         ↓              ↓             ↓
   ┌────────┐ ┌────────┐ ┌────────┐  ┌─────────┐      ┌────────────┐
   │Auth    │ │Projects│ │File    │  │Generator│      │Notification│
   │Service │ │Service │ │Service │  │Service  │      │Service     │
   └─┬──────┘ └─┬──────┘ └─┬──────┘  └─────────┘      └────┬───────┘
     │          │          │                               │
     └──────────┴──────────┴───────────────────────────────┘
                    │                        │
                    ↓                        ↓
           ┌────────────────┐       ┌──────────┐
           │  PostgreSQL    │       │ RabbitMQ │
           │  (Shared DB)   │       │  Queue   │
           └────────────────┘       └──────────┘
                                         │
                                         ↓
                                    ┌──────────────┐
                                    │ email worker │
                                    └──────────────┘
```

-------------

## Сервисы

### 1. **Auth Service**
- Аутентификация и авторизация (JWT)
- Управление пользователями и ролями
- Регистрация, вход, обновление профиля

[Подробнее →](./auth-service/README.md)

### 2. **BFF Service**
- API Gateway для фронтенда
- Оркестрация запросов между сервисами
- Аггрегация данных
- Единая точка входа

[Подробнее →](./bff-service/README.md)

### 3. **Projects Service**
- Управление проектами
- Хранение field mappings
- История изменений проектов
- CRUD операции

[Подробнее →](./projects-service/README.md)

### 4. **Files Service**
- Загрузка и хранение файлов
- Управление JSON/XSD схемами
- Тестовые данные и VM шаблоны
- Скачивание файлов

[Подробнее →](./files-service/README.md)

### 5. **Generator Service**
- Парсинг JSON Schema и XSD
- Автоматический маппинг полей
- Генерация Apache Velocity шаблонов
- Валидация шаблонов
- Stateless сервис

[Подробнее →](./generator-service/README.md)

### 6. **Notification Service**
- Отправка email уведомлений
- Асинхронная обработка через RabbitMQ
- История уведомлений
- Retry механизм

[Подробнее →](./notification-service/README.md)

-------------

## Технологический стек

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Message Queue**: RabbitMQ
- **Validation**: Pydantic
- **Async**: asyncio, httpx, aiofiles
- **XML/XSD**: lxml, xmlschema
- **JSON**: jsonschema, json-ref-dict
- **Fuzzy Matching**: rapidfuzz

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Desktop**: Electron (опционально)

### Infrastructure
- **Reverse Proxy**: NGINX
- **Containerization**: Docker + Docker Compose
- **CI/CD**: Docker Compose (dev/prod)
- **Storage**: Local File System (можно заменить на S3/MinIO)

-------------

## Режимы развертывания

Платформа поддерживает три режима работы в зависимости от ваших требований к инфраструктуре и интеграции:

### 1. Полностью Web решение (Production)

**Файл конфигурации:** `docker-compose.prod.yml`

Полноценное облачное решение с веб-интерфейсом для работы через браузер.

**Особенности:**
- ✅ Все компоненты в контейнерах (включая frontend)
- ✅ NGINX для reverse proxy и load balancing
- ✅ CloudPub для публичного доступа к приложению
- ✅ Полная облачная инфраструктура
- ✅ Email уведомления через RabbitMQ
- ✅ Автоматический SSL (с настройкой)
- ✅ Готово для production развертывания

**Идеально для:**
- Публичного доступа к платформе
- Командной работы
- Enterprise развертывания
- Работы из любого браузера

**Запуск:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Доступ:**
- Web UI: `https://your-domain.com` (через CloudPub)
- API: `https://your-domain.com/api`

---

### 2. Гибрид: Desktop приложение + Облачные сервисы (Development)

**Файл конфигурации:** `docker-compose.dev.yml`

Оптимальное решение для разработки - десктоп приложение с облачным хранилищем и функционалом.

**Особенности:**
- ✅ Backend сервисы в контейнерах (Docker)
- ✅ Frontend как desktop приложение (Electron)
- ✅ Облачное хранилище файлов
- ✅ RabbitMQ для очередей
- ✅ Email уведомления
- ✅ CloudPub для публичного доступа к backend API
- ✅ Hot reload для разработки

**Идеально для:**
- Разработки и тестирования
- Desktop UX с облачными возможностями
- Работы с удаленной командой
- Доступа к backend API извне

**Запуск:**
```bash
# 1. Запустить backend сервисы
docker-compose -f docker-compose.dev.yml up -d

# 2. Запустить desktop приложение
cd frontend
npm install
npm run dev:electron
```

**Доступ:**
- Desktop UI: Electron приложение (автоматически откроется)
- Backend API: `http://localhost:8000` или через CloudPub публичный URL
- RabbitMQ UI: `http://localhost:15672`

---

### 3. Полностью локальное решение (Offline)

**Файл конфигурации:** `docker-compose.local.yml`

Автономное решение для работы без интернета - все хранится локально.

**Особенности:**
- ✅ Минимальный набор сервисов
- ✅ Desktop приложение (Electron)
- ✅ Локальное хранилище файлов
- ✅ Работает БЕЗ интернета
- ❌ Без email уведомлений (нет RabbitMQ)
- ❌ Без CloudPub (нет публичного доступа)
- ❌ Без NGINX (прямое подключение к BFF)

**Состав сервисов:**
- PostgreSQL (2 базы данных)
- BFF Service (API Gateway)
- Files Service (локальное хранилище)
- Projects Service
- Generator Service

**Идеально для:**
- Работы без интернета
- Защищенных/изолированных сред
- Личного использования
- Максимальной приватности данных

**Запуск:**
```bash
# 1. Запустить локальные backend сервисы
docker-compose -f docker-compose.local.yml up -d

# 2. Запустить desktop приложение
cd frontend
npm install
npm run dev:electron
```

**Доступ:**
- Desktop UI: Electron приложение
- Backend API: `http://localhost:8000` (только локально)

---

### Сравнительная таблица режимов

| Функционал | Production (Web) | Development (Hybrid) | Local (Offline) |
|------------|------------------|----------------------|-----------------|
| **Frontend** | Web (в контейнере) | Desktop (Electron) | Desktop (Electron) |
| **Backend** | Docker | Docker | Docker |
| **Доступ** | Публичный URL | Desktop + API URL | Только локально |
| **Хранилище** | Облачное | Облачное | Локальное |
| **Email уведомления** | ✅ | ✅ | ❌ |
| **Интернет** | Обязателен | Обязателен | Не требуется |
| **NGINX** | ✅ | ✅ | ❌ |
| **CloudPub** | ✅ | ✅ | ❌ |
| **RabbitMQ** | ✅ | ✅ | ❌ |
| **Hot reload** | ❌ | ✅ | ✅ |

---

### Переключение между режимами

```bash
# Остановить текущий режим
docker-compose -f docker-compose.<current>.yml down

# Запустить новый режим
docker-compose -f docker-compose.<new>.yml up -d
```

**Важно:** Данные БД сохраняются в отдельных volumes для каждого режима, поэтому переключение безопасно.

-------------

## Быстрый старт

### Требования
- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Node.js** 18+ (для фронтенда)
- **npm** или **yarn**
- 4GB RAM minimum
- 10GB свободного места

### Development режим (пошаговая инструкция)

#### Шаг 1: Клонирование репозитория

```bash
git clone <repository-url>
cd test
```

#### Шаг 2: Запуск Backend сервисов

```bash
# Запустить все backend сервисы (PostgreSQL, RabbitMQ, все API)
docker-compose -f docker-compose.dev.yml up -d

# Дождаться пока все контейнеры запустятся (~30 секунд)
# Проверить статус
docker-compose -f docker-compose.dev.yml ps

# Должно быть 8 контейнеров в статусе "Up":
# - postgres-db
# - rabbitmq
# - auth-service
# - bff-service
# - projects-service
# - files-service
# - generator-service
# - notification-service
```

**Проверка работоспособности backend:**
```bash
# Проверить health check
curl http://localhost:8000/health
# Ожидаемый ответ: {"status":"healthy"}

# Открыть Swagger документацию
open http://localhost:8000/docs
```

#### Шаг 3: Запуск Frontend

```bash
# Перейти в директорию фронтенда
cd frontend

# Установить зависимости (первый раз)
npm install

# Запустить frontend в режиме разработки
npm run dev

# ИЛИ запустить в режиме Electron desktop приложения
npm run dev:electron
```

**После запуска:**
- Frontend (web): http://localhost:5173
- Frontend (electron): откроется desktop окно

#### Шаг 4: Создание первого пользователя

```bash
# Зарегистрировать пользователя через Swagger UI
# или через curl:
curl -X POST http://localhost:8000/api/auth/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123",
    "confirm_password": "admin123"
  }'
```

### Доступы к сервисам

| Сервис | URL | Логин/Пароль |
|--------|-----|--------------|
| Frontend (Web) | http://localhost:5173 | - |
| BFF API | http://localhost:8000 | - |
| Swagger Docs | http://localhost:8000/docs | - |
| PostgreSQL | localhost:5432 | postgres / postgres |
| RabbitMQ UI | http://localhost:15672 | guest / guest |

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.dev.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.dev.yml logs -f bff-service

# Последние 100 строк
docker-compose -f docker-compose.dev.yml logs --tail=100 generator-service
```

### Остановка сервисов

```bash
# Остановить backend
docker-compose -f docker-compose.dev.yml down

# Остановить и удалить данные (volumes)
docker-compose -f docker-compose.dev.yml down -v

# Frontend останавливается через Ctrl+C в терминале
```

### Production

```bash
# Запустить в production режиме
docker-compose -f docker-compose.prod.yml up -d
```

**Доступы:**
- Frontend: https://your-domain.com
- BFF API: https://your-domain.com/api
- Все через NGINX (SSL + Load Balancing)

-------------

## Основной flow работы

### Создание проекта (ONE-SHOT API)

```bash
POST /api/projects/full
```

**Один запрос делает всё:**
1. Создаёт проект
2. Загружает файлы (JSON schema, XSD schema, test data)
3. Парсит схемы
4. Автоматически маппит поля
5. Генерирует VM шаблон
6. Валидирует шаблон
7. Сохраняет результаты

**Время выполнения:** ~5 секунда ⚡

### Результат

Вы получаете:
- Созданный проект (status: COMPLETED)
- 3 загруженных файла (JSON, XSD, test_data)
- N автоматических маппингов (с confidence score)
- Сгенерированный VM шаблон (готов к использованию)
- Результаты валидации
- Предпросмотр XML (если переданы test_data)

### Редактирование (опционально)

Если автоматический маппинг неточный:
- Просмотр маппингов: `GET /api/projects/{id}/mappings`
- Обновление: `PUT /api/projects/mappings/{id}`
- Пересоздание шаблона: `POST /api/generator/generate`

-------------

## Примеры использования

### Простой пример

```bash
# 1. Логин
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response: { "access_token": "eyJ...", ... }

# 2. Создать проект с генерацией (ONE-SHOT!)
curl -X POST http://localhost:8000/api/projects/full \
  -H "Authorization: Bearer eyJ..." \
  -F "name=My Project" \
  -F "description=Test project" \
  -F "files=@json_schema.json" \
  -F "files=@xsd_schema.xsd" \
  -F "files=@test_data.json" \
  -F "file_types=JSON_SCHEMA,XSD_SCHEMA,TEST_DATA" \
  -F "generate=true"

# Response: полный результат с проектом, файлами, маппингами, шаблоном!

# 3. Скачать сгенерированный VM шаблон
curl -X GET http://localhost:8000/api/files/{template_id}/download \
  -H "Authorization: Bearer eyJ..." \
  -o generated_template.vm
```

### Тестовые данные

В директории `doc/test/files/` есть готовые примеры:
- **simple/** - простая схема (5 полей)
- **medium/** - средняя сложность (15 полей)
- **complex/** - сложная схема (24+ полей)

-------------

## API Documentation

После запуска доступна интерактивная документация:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

-------------

## Конфигурация

### Переменные окружения

Основные настройки находятся в `docker-compose.dev.yml` / `docker-compose.prod.yml`

**Обязательные:**
```env
# Database
DATABASE_URL=postgresql://user:pass@postgres-db:5432/project_db

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# SMTP (для уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Опциональные:**
```env
# Генератор
DEFAULT_CONFIDENCE_THRESHOLD=0.5
MAX_SCHEMA_SIZE=10485760

# Файлы
MAX_FILE_SIZE=104857600
STORAGE_PATH=/app/storage
```

-------------

## Мониторинг и отладка

### Проверка здоровья сервисов
```bash
# Health check всех сервисов
curl http://localhost:8000/health

# Статус контейнеров
docker-compose -f docker-compose.dev.yml ps
```

### База данных
```bash
# Подключиться к PostgreSQL
docker exec -it postgres-db psql -U postgres -d project_db

# Просмотр таблиц
\dt

# Количество проектов
SELECT COUNT(*) FROM projects;
```

### RabbitMQ
- Web UI: http://localhost:15672
- Login: guest / guest
- Просмотр очередей и сообщений

-------------

## Безопасность

### Реализовано:
-  JWT аутентификация с ограниченным временем жизни
-  Пароли хешируются с bcrypt
-  HTTPS в production (через NGINX)
-  CORS настройки
-  SQL injection защита (ORM)
-  Валидация всех входных данных (Pydantic)
-  Rate limiting (опционально в NGINX)
-  Изоляция сервисов (Docker network)

### Рекомендации для production:
-  Сменить SECRET_KEY на случайный длинный ключ
-  Использовать HTTPS с валидными сертификатами
-  Настроить firewall (только 80, 443 порты открыты)
-  Регулярные бэкапы PostgreSQL
-  Мониторинг логов на подозрительную активность
-  Обновлять зависимости (security patches)
-  Создавать репликации (bff-service особенно)

-------------

## Разработка

### Структура проекта
```
project_name/
├── auth-service/          # Аутентификация
├── bff-service/           # API Gateway
├── projects-service/      # Проекты и маппинги
├── files-service/         # Файлы
├── generator-service/     # Генерация VM
├── notification-service/  # Уведомления
├── frontend/              # React UI
├── infrastructure/        # NGINX configs
├── doc/                   # Документация
│   ├── setup/            # Инструкции по настройке
│   ├── test/             # Тестовые данные
│   └── tz/               # Техническое задание
│   └── service/           # Описание сервисов
├── docker-compose.dev.yml
├── docker-compose.prod.yml
└── README.md
```

### Добавление нового сервиса
1. Создать директорию `new-service/`
2. Добавить `Dockerfile` и `requirements.txt`
3. Добавить в `docker-compose.dev.yml`
4. Добавить клиента в `bff-service/app/services/`

### Hot reload
В development режиме все сервисы автоматически перезагружаются при изменении кода (volumes mounted).

-------------

## Roadmap

### В разработке:
- [ ] Улучшение алгоритмов маппинга (ML модель)
- [ ] Версионирование проектов
- [ ] Экспорт/импорт проектов
- [ ] Batch генерация (несколько проектов)
- [ ] Графический редактор маппингов

### Планируется:
- [ ] Kubernetes deployment
- [ ] Prometheus + Grafana мониторинг
- [ ] ELK Stack для логов
- [ ] S3/MinIO для файлов
- [ ] Redis для кеширования
- [ ] CI/CD пайплайн (GitHub Actions)

-------------

## Итоги

Разработано для автоматизации интеграций с государственными информационными системами.

**Технологический стек выбран для:**
- Высокой производительности (FastAPI + async)
- Гибкости и масштабируемости (микросервисы)
- Простоты разработки (Python + TypeScript)
- Надёжности (Docker + PostgreSQL)

