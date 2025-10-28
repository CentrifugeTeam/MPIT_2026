#!/bin/bash

# Этот скрипт запускает приложение (с выбором режима)
cd "$(dirname "$0")/.."

echo "=========================================="
echo "   Запуск мёрджер"
echo "=========================================="
echo ""

# Проверяем наличие интернета
echo "🌐 Проверка подключения к интернету..."
if curl -s --connect-timeout 3 https://google.com > /dev/null 2>&1; then
    HAS_INTERNET=true
    echo "✅ Интернет доступен"
else
    HAS_INTERNET=false
    echo "⚠️  Интернет недоступен"
fi

echo ""

# Выбор режима работы
if [ "$HAS_INTERNET" = true ]; then
    echo "📡 Выберите режим работы:"
    echo "   1) Облачный режим (требуется интернет)"
    echo "   2) Локальный режим (все данные на вашем компьютере)"
    echo ""
    read -p "Ваш выбор (1 или 2): " MODE_CHOICE

    if [ "$MODE_CHOICE" = "1" ]; then
        USE_LOCAL_MODE=false
        echo "☁️  Выбран облачный режим"
    else
        USE_LOCAL_MODE=true
        echo "🔧 Выбран локальный режим"
    fi
else
    echo "ℹ️  Интернет недоступен - автоматически включен локальный режим"
    USE_LOCAL_MODE=true
fi

# Проверяем Docker и образы только для локального режима
if [ "$USE_LOCAL_MODE" = true ]; then
    echo ""

    # Проверяем Docker
    if ! docker info &> /dev/null; then
        echo "❌ Docker не запущен"
        echo ""
        echo "📦 Пожалуйста:"
        echo "   1. Откройте Docker Desktop (иконка кита в верхнем меню)"
        echo "   2. Подождите пока Docker запустится"
        echo "   3. Запустите этот скрипт снова"
        echo ""
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi

    echo "✓ Docker запущен"

    # Проверяем наличие образов
    echo "Проверка Docker образов для локального режима..."
    if ! docker images | grep -q "bff-service.*local\|files-service.*local\|projects-service.*local\|generator-service.*local\|postgres.*15"; then
        echo "❌ Docker образы не найдены"
        echo ""
        echo "📥 Сначала запустите подготовку:"
        echo "   cd '/Users/germanmironchuc/Desktop/pet projects/test'"
        echo "   ./local.bash"
        echo ""
        echo "   Это загрузит все Docker образы из репозитория"
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi

    echo "✓ Docker образы готовы (offline режим)"
else
    echo ""
    echo "☁️  Облачный режим - Docker не требуется"
fi

echo ""
echo "[1/3] Остановка старых контейнеров..."
if [ "$USE_LOCAL_MODE" = true ]; then
    docker-compose -f docker-compose.local.yml down 2>/dev/null || true
else
    echo "   (Пропуск - облачный режим не требует локальных контейнеров)"
fi

echo ""
echo "[2/3] Запуск сервисов..."

if [ "$USE_LOCAL_MODE" = true ]; then
    echo "    (это может занять 30-60 секунд при первом запуске)"

    # Запускаем контейнеры из готовых образов (БЕЗ сборки)
    echo "✓ Запуск контейнеров из загруженных образов..."
    docker-compose -f docker-compose.local.yml up -d

    # Ждём пока сервисы запустятся
    echo ""
    echo "⏳ Ожидание запуска сервисов..."
    sleep 15

    # Проверяем что BFF сервис работает
    if curl -s http://localhost:8000 >/dev/null 2>&1; then
        echo "✅ Локальные сервисы запущены успешно!"
    else
        echo "⚠️  Сервисы ещё запускаются, подождите ещё немного..."
        sleep 10
    fi
else
    echo "✅ Облачный режим - локальные сервисы не требуются"
fi

echo ""
echo "[3/3] Запуск приложения..."
cd frontend

# Удаляем папку release если она мешает
if [ -d "release" ]; then
    rm -rf release
fi

# Проверяем зависимости
if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
fi

echo ""
echo "✅ Всё готово! Приложение откроется сейчас..."
echo ""

# Убиваем старые процессы
pkill -f "vite\|electron" || true
sleep 2

# Очищаем кэш Vite для применения новых переменных окружения
echo "🧹 Очистка кэша Vite..."
rm -rf node_modules/.vite 2>/dev/null || true

# Настраиваем переменные окружения и запускаем в зависимости от режима
if [ "$USE_LOCAL_MODE" = true ]; then
    echo "ℹ️  Режим: Локальный (localhost)"
    echo "ℹ️  Для остановки: закройте окно или нажмите Ctrl+C"
    echo ""

    # Создаем/обновляем .env.local для локального режима
    echo "VITE_BACKEND_LOCAL=true" > .env.local

    echo "🚀 Запуск приложения в локальном режиме..."
    echo "   (Vite + Electron)"
    echo ""

    # Запускаем dev:electron:local
    yarn dev:electron:local
else
    echo "ℹ️  Режим: Облачный (требуется интернет)"
    echo "ℹ️  Для остановки: закройте окно или нажмите Ctrl+C"
    echo ""

    # Создаем/обновляем .env.local для облачного режима
    echo "VITE_BACKEND_LOCAL=false" > .env.local

    echo "🚀 Запуск приложения в облачном режиме..."
    echo "   (Vite + Electron)"
    echo ""

    # Запускаем dev:electron:cloud
    yarn dev:electron:cloud
fi

# Функция для очистки при завершении
cleanup() {
    echo ""
    echo "🛑 Завершение работы..."

    # Убиваем процессы Vite и Electron
    echo "📦 Остановка Vite и Electron..."
    pkill -f "vite\|electron" || true
    sleep 2

    # Останавливаем Docker контейнеры только если был локальный режим
    if [ "$USE_LOCAL_MODE" = true ]; then
        echo "🐳 Остановка Docker контейнеров..."
        cd "$(dirname "$0")/.."
        docker-compose -f docker-compose.local.yml down 2>/dev/null || true
    fi

    echo "✅ Очистка завершена"
    exit 0
}

# Устанавливаем обработчик сигналов для корректного завершения
# EXIT - при любом завершении скрипта, SIGINT - Ctrl+C, SIGTERM - kill
trap cleanup EXIT SIGINT SIGTERM

# Ждём завершения процесса (Ctrl+C для выхода)
wait
