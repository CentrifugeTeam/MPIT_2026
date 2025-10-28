# Dockerfile для фронтенда с поддержкой dev и prod режимов

# Stage 1: Base - установка зависимостей
FROM node:22-alpine AS base

WORKDIR /app

# Копируем package files
COPY package*.json ./

# Устанавливаем зависимости (используем ci для скорости и детерминизма)
# --legacy-peer-deps если есть конфликты, --prefer-offline для кеша
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Копируем исходный код
COPY . .


# Stage 2: Development - для разработки с hot reload
FROM base AS development

# Устанавливаем wget для healthcheck
RUN apk add --no-cache wget

# Expose порт для Vite dev server
EXPOSE 5173

# Запуск dev сервера
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# Stage 3: Builder - сборка production build
FROM base AS builder

# Собираем приложение
RUN npm run build


# Stage 4: Production - раздача собранных файлов
FROM node:22-alpine AS production

WORKDIR /app

# Устанавливаем wget для healthcheck и serve для раздачи статики
RUN apk add --no-cache wget && \
    npm install -g serve

# Копируем собранные файлы
COPY --from=builder /app/dist ./dist

# Expose порт
EXPOSE 5173

# Запуск с помощью serve
CMD ["serve", "-s", "dist", "-l", "5173"]
