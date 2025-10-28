#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Подготовка OFFLINE режима${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}ℹ️  Этот скрипт подготавливает систему:${NC}"
echo -e "${GREEN}✓${NC} Загружает Docker образы из репозитория"
echo -e "${GREEN}✓${NC} Проверяет все зависимости"
echo -e "${GREEN}✓${NC} После этого используйте start-local.command для запуска"
echo -e ""

# Функция для проверки Node.js
check_nodejs() {
    echo -e "${YELLOW}[1/4]${NC} Проверка Node.js..."

    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js не установлен${NC}"
        echo -e "${RED}Установите Node.js версии 18 или выше:${NC}"
        echo -e "${BLUE}  https://nodejs.org/${NC}\n"
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        echo -e "${RED}✗ Требуется Node.js версии 18 или выше${NC}"
        echo -e "${YELLOW}Текущая версия: $(node -v)${NC}\n"
        exit 1
    fi

    echo -e "${GREEN}✓ Node.js $(node -v) установлен${NC}\n"
}

# Функция для загрузки Docker образов из репозитория
load_docker_images() {
    echo -e "${YELLOW}[2/4]${NC} Загрузка Docker образов..."

    IMAGES_DIR="docker-images"

    # Проверяем наличие папки с образами
    if [ ! -d "$IMAGES_DIR" ]; then
        echo -e "${RED}✗ Папка $IMAGES_DIR не найдена${NC}"
        echo -e "${RED}Запустите export-docker-images.bash на машине с интернетом${NC}\n"
        exit 1
    fi

    # Проверяем наличие файлов образов
    if [ -z "$(ls -A $IMAGES_DIR/*.tar 2>/dev/null)" ]; then
        echo -e "${RED}✗ В папке $IMAGES_DIR нет файлов образов${NC}"
        echo -e "${RED}Запустите export-docker-images.bash на машине с интернетом${NC}\n"
        exit 1
    fi

    # Загружаем каждый образ
    echo -e "${BLUE}Загрузка образов в Docker...${NC}"
    for image_file in "$IMAGES_DIR"/*.tar; do
        if [ -f "$image_file" ]; then
            local filename=$(basename "$image_file")
            echo -e "  ${BLUE}→${NC} Загрузка $filename..."
            if docker load -i "$image_file" > /dev/null 2>&1; then
                echo -e "    ${GREEN}✓${NC} Загружено"
            else
                echo -e "    ${YELLOW}⚠${NC} Образ уже загружен или ошибка"
            fi
        fi
    done

    echo -e "${GREEN}✓ Docker образы готовы${NC}\n"
}

# Функция для проверки Docker
check_docker() {
    echo -e "${YELLOW}[3/4]${NC} Проверка Docker..."

    # Проверяем, установлен ли Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker не установлен${NC}"
        echo -e "${RED}Установите Docker Desktop для вашей системы:${NC}"
        echo -e "${BLUE}  macOS: https://www.docker.com/products/docker-desktop${NC}"
        echo -e "${BLUE}  Windows: https://www.docker.com/products/docker-desktop${NC}"
        echo -e "${BLUE}  Linux: https://docs.docker.com/engine/install/${NC}\n"
        exit 1
    fi

    # Проверяем, запущен ли Docker daemon
    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon не запущен${NC}"
        echo -e "${YELLOW}Запустите Docker Desktop и повторите попытку${NC}\n"
        exit 1
    fi

    echo -e "${GREEN}✓ Docker установлен и работает${NC}\n"
}

# Главная функция
main() {
    # Проверяем Node.js (обязательно)
    check_nodejs

    # Загружаем Docker образы из репозитория
    load_docker_images

    # Проверяем Docker (обязательно)
    check_docker

    # Проверяем зависимости
    echo -e "${YELLOW}[4/4]${NC} Проверка npm зависимостей..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo -e "${BLUE}Установка npm пакетов...${NC}"
        if npm install --silent 2>/dev/null; then
            echo -e "${GREEN}✓ Зависимости установлены${NC}\n"
        else
            echo -e "${YELLOW}⚠️  Требуется интернет для npm install${NC}"
            echo -e "${YELLOW}   Запустите: cd frontend && npm install${NC}\n"
        fi
    else
        echo -e "${GREEN}✓ Зависимости уже установлены${NC}\n"
    fi
    cd ..

    # Готово
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✅ Подготовка завершена!${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    echo -e "${BLUE}Docker образы готовы:${NC}"
    docker images | grep -E "postgres:15|:local" | awk '{print "  ✓ " $1 ":" $2}'

    echo -e "\n${YELLOW}Следующий шаг:${NC}"
    echo -e "${GREEN}Запустите приложение командой:${NC}"
    echo -e "${BLUE}  cd frontend && ./start-local.command${NC}\n"
}

# Запуск
main

