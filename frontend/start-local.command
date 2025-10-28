#!/bin/bash

# Этот скрипт запускает приложение в ЛОКАЛЬНОМ режиме (без интернета)
cd "$(dirname "$0")/.."

echo "=========================================="
echo "   Запуск мёрджер (Локальный режим)"
echo "=========================================="
echo ""
echo "ℹ️  Локальный режим: приложение работает БЕЗ интернета"
echo "ℹ️  Все данные хранятся на вашем компьютере"
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
echo ""

# Проверяем интернет (только для предупреждения)
if ! ping -c 1 8.8.8.8 &> /dev/null; then
    echo "⚠️  Нет подключения к интернету"

    # Проверяем, скачаны ли образы
    if ! docker images | grep -q "postgres\|nginx"; then
        echo "❌ Docker образы ещё не скачаны"
        echo ""
        echo "📥 Для первого запуска нужен интернет (один раз)"
        echo "   После загрузки образов (~1.5 GB) интернет не нужен"
        echo ""
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi

    echo "✓ Docker образы уже скачаны - можно работать без интернета!"
else
    echo "✓ Интернет доступен"
fi

echo ""
echo "[1/3] Остановка старых контейнеров..."
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

echo ""
echo "[2/3] Запуск локальных сервисов..."
echo "    (это может занять 30-60 секунд при первом запуске)"

# Проверяем есть ли уже собранные образы
if docker images | grep -q "test-bff-service\|test-files-service\|test-projects-service\|test-generator-service"; then
    echo "✓ Используем уже собранные образы"
    docker-compose -f docker-compose.local.yml up -d
else
    echo "⚠️  Образы не найдены - требуется сборка (нужен интернет)"
    if ping -c 1 8.8.8.8 &> /dev/null; then
        docker-compose -f docker-compose.local.yml up -d --build
    else
        echo "❌ Нет интернета для сборки образов"
        echo ""
        echo "📥 Сначала выполните с интернетом:"
        echo "   cd '/Users/germanmironchuc/Desktop/pet projects/test'"
        echo "   docker-compose -f docker-compose.local.yml build"
        echo ""
        read -p "Нажмите Enter для выхода..."
        exit 1
    fi
fi

# Ждём пока сервисы запустятся
echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Проверяем что сервисы работают
if curl -s http://localhost/api >/dev/null 2>&1; then
    echo "✅ Локальные сервисы запущены успешно!"
else
    echo "⚠️  Сервисы ещё запускаются, подождите..."
    sleep 10
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
echo "ℹ️  Режим: Локальный (localhost)"
echo "ℹ️  Для остановки: закройте окно или нажмите Ctrl+C"
echo ""

# Запускаем в локальном режиме
# Убиваем старые процессы
pkill -f "vite\|electron" || true
sleep 2

# Запускаем Vite в фоне с правильной переменной
echo "📦 Запуск Vite..."
yarn dev:local &
VITE_PID=$!

# Ждём запуска Vite (простая проверка)
echo "⏳ Ожидание запуска Vite..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "✅ Vite запущен!"
        break
    fi
    sleep 1
    echo "   Попытка $i/30..."
done

# Запускаем Electron
echo "🖥️  Запуск Electron..."
npx cross-env VITE_BACKEND_LOCAL=true electron . &
ELECTRON_PID=$!

echo "✅ Приложение запущено!"
echo "📱 Vite: http://localhost:5173"
echo "🖥️  Electron: PID $ELECTRON_PID"

# Функция для очистки при завершении
cleanup() {
    echo ""
    echo "🛑 Завершение работы..."

    # Убиваем процессы
    echo "📦 Остановка Vite и Electron..."
    kill $VITE_PID $ELECTRON_PID 2>/dev/null || true
    pkill -f "vite\|electron" || true

    # Останавливаем контейнеры
    echo "🐳 Остановка Docker контейнеров..."
    cd "$(dirname "$0")/.."
    docker-compose -f docker-compose.local.yml down 2>/dev/null || true

    echo "✅ Очистка завершена"
    exit 0
}

# Устанавливаем обработчик сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Ждём завершения Electron
wait $ELECTRON_PID

# Если Electron завершился сам, тоже делаем cleanup
cleanup
