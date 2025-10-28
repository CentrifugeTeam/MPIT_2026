#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Запуск локального приложения${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}ℹ️  Важная информация:${NC}"
echo -e "${GREEN}✓ Первый запуск:${NC} требуется интернет для загрузки Docker образов (~1.5 GB)"
echo -e "${GREEN}✓ Последующие запуски:${NC} интернет НЕ нужен - всё работает локально!"
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

# Функция для проверки интернета
check_internet() {
    echo -e "${YELLOW}[2/4]${NC} Проверка подключения к интернету..."

    # Проверяем доступность нескольких популярных серверов
    if ping -c 1 8.8.8.8 &> /dev/null || ping -c 1 1.1.1.1 &> /dev/null; then
        echo -e "${GREEN}✓ Интернет доступен${NC}\n"
        return 0
    else
        echo -e "${RED}✗ Нет подключения к интернету${NC}"
        echo -e "${RED}Для первого запуска необходим интернет для загрузки Docker образов${NC}"
        echo -e "${YELLOW}Если образы уже загружены, приложение запустится${NC}\n"
        return 1
    fi
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

# Функция для запуска Docker Compose
start_docker() {
    echo -e "${YELLOW}[4/4]${NC} Запуск Docker контейнеров..."

    # Останавливаем существующие контейнеры (если есть)
    echo -e "${BLUE}Остановка существующих контейнеров...${NC}"
    docker-compose -f docker-compose.local.yml down &> /dev/null

    # Запускаем контейнеры
    echo -e "${BLUE}Запуск локальных сервисов...${NC}"
    if docker-compose -f docker-compose.local.yml up -d --build; then
        echo -e "${GREEN}✓ Docker контейнеры успешно запущены${NC}\n"

        # Ждем, пока сервисы запустятся
        echo -e "${YELLOW}Ожидание запуска сервисов (это может занять 30-60 секунд)...${NC}"
        sleep 15

        # Проверяем статус контейнеров
        echo -e "\n${BLUE}Статус контейнеров:${NC}"
        docker-compose -f docker-compose.local.yml ps

        return 0
    else
        echo -e "${RED}✗ Ошибка при запуске Docker контейнеров${NC}\n"
        return 1
    fi
}

# Функция для установки зависимостей
install_dependencies() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${YELLOW}Установка зависимостей...${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    cd frontend

    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Установка npm пакетов (это может занять несколько минут)...${NC}"
        npm install
        echo -e "${GREEN}✓ Зависимости установлены${NC}\n"
    else
        echo -e "${GREEN}✓ Зависимости уже установлены${NC}\n"
    fi

    cd ..
}

# Функция для сборки Electron приложения
build_electron() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${YELLOW}Сборка Electron приложения${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    cd frontend

    # Определяем текущую платформу
    if [[ "$OSTYPE" == "darwin"* ]]; then
        PLATFORM="macOS"
        BUILD_CMD="build:electron"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        PLATFORM="Linux"
        BUILD_CMD="build:electron"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        PLATFORM="Windows"
        BUILD_CMD="build:electron"
    else
        PLATFORM="Unknown"
        BUILD_CMD="build:electron"
    fi

    echo -e "${BLUE}Платформа: ${GREEN}$PLATFORM${NC}"
    echo -e "${YELLOW}Хотите собрать приложение для:${NC}"
    echo -e "  ${GREEN}1)${NC} Только текущая платформа ($PLATFORM)"
    echo -e "  ${GREEN}2)${NC} Все платформы (macOS, Windows, Linux)"
    echo -e "  ${GREEN}3)${NC} Пропустить сборку\n"

    read -p "Выберите вариант (1-3): " build_choice

    case $build_choice in
        1)
            echo -e "\n${YELLOW}Сборка для $PLATFORM...${NC}"
            echo -e "${BLUE}(Это может занять 5-10 минут)${NC}\n"
            npm run build:electron
            ;;
        2)
            echo -e "\n${YELLOW}Сборка для всех платформ...${NC}"
            echo -e "${BLUE}(Это может занять 15-20 минут)${NC}\n"
            npm run build:electron:all
            ;;
        3)
            echo -e "\n${BLUE}Сборка пропущена${NC}\n"
            cd ..
            return 0
            ;;
        *)
            echo -e "\n${RED}Неверный выбор. Сборка пропущена.${NC}\n"
            cd ..
            return 0
            ;;
    esac

    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}========================================${NC}"
        echo -e "${GREEN}✓ Сборка завершена успешно!${NC}"
        echo -e "${GREEN}========================================${NC}\n"

        if [ -d "release" ]; then
            echo -e "${BLUE}Готовые файлы находятся в:${NC}"
            echo -e "${GREEN}$(pwd)/release/${NC}\n"

            echo -e "${BLUE}Список файлов:${NC}"
            ls -lh release/ | tail -n +2
            echo ""

            # Предупреждение для macOS
            if [[ "$OSTYPE" == "darwin"* ]]; then
                echo -e "${YELLOW}⚠️  Важно для macOS:${NC}"
                echo -e "${YELLOW}Приложение не подписано Apple Developer сертификатом.${NC}"
                echo -e "${YELLOW}При первом запуске macOS может заблокировать его.${NC}\n"

                echo -e "${BLUE}Как открыть неподписанное приложение:${NC}"
                echo -e "  ${GREEN}1.${NC} Кликните ПРАВОЙ кнопкой на .dmg → Открыть"
                echo -e "  ${GREEN}2.${NC} Или используйте команду:"
                echo -e "     ${GREEN}xattr -cr /Applications/мёрджер.app${NC}"
                echo -e "     ${GREEN}open /Applications/мёрджер.app${NC}\n"

                echo -e "${BLUE}Для production сборки нужен:${NC}"
                echo -e "  - Apple Developer Account ($99/год)"
                echo -e "  - Developer ID Application сертификат"
                echo -e "  - Подробнее: https://developer.apple.com/developer-id/\n"
            fi
        fi
    else
        echo -e "\n${RED}✗ Ошибка при сборке${NC}\n"
    fi

    cd ..
}

# Функция для запуска Electron приложения в режиме разработки
start_electron() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${YELLOW}Запуск Electron приложения (режим разработки)${NC}"
    echo -e "${BLUE}========================================${NC}\n"

    cd frontend

    # Запускаем Electron в режиме разработки
    echo -e "${GREEN}Запуск приложения...${NC}\n"
    npm run dev:electron:local
}

# Главная функция
main() {
    # Проверяем Node.js (обязательно)
    check_nodejs

    # Проверяем интернет (предупреждение, но не критично)
    check_internet

    # Проверяем Docker (обязательно)
    check_docker

    # Запускаем Docker контейнеры
    if start_docker; then
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Локальные сервисы готовы к работе!${NC}"
        echo -e "${GREEN}========================================${NC}\n"

        echo -e "${BLUE}API доступен по адресу: ${GREEN}http://localhost${NC}"
        echo -e "${BLUE}BFF Service: ${GREEN}http://localhost:8000${NC}"
        echo -e "${BLUE}Files Service: ${GREEN}http://localhost:8006${NC}"
        echo -e "${BLUE}Projects Service: ${GREEN}http://localhost:8004${NC}"
        echo -e "${BLUE}Generator Service: ${GREEN}http://localhost:8005${NC}\n"

        # Устанавливаем зависимости
        install_dependencies

        # Спрашиваем, что делать дальше
        echo -e "${YELLOW}Что вы хотите сделать?${NC}"
        echo -e "  ${GREEN}1)${NC} Собрать приложение для распространения (релизный билд)"
        echo -e "  ${GREEN}2)${NC} Запустить в режиме разработки"
        echo -e "  ${GREEN}3)${NC} Выход\n"

        read -p "Выберите вариант (1-3): " user_choice

        case $user_choice in
            1)
                build_electron
                echo -e "\n${GREEN}Готово! Теперь можно распространять приложение.${NC}"
                echo -e "${BLUE}Инструкция по установке:${NC}"
                echo -e "  ${YELLOW}macOS:${NC} Откройте .dmg файл и перетащите приложение в Applications"
                echo -e "  ${YELLOW}Windows:${NC} Запустите .exe установщик"
                echo -e "  ${YELLOW}Linux:${NC} Установите .deb или запустите .AppImage\n"
                ;;
            2)
                start_electron
                ;;
            3)
                echo -e "\n${BLUE}До свидания!${NC}\n"
                exit 0
                ;;
            *)
                echo -e "\n${YELLOW}Неверный выбор. Выход.${NC}\n"
                echo -e "${BLUE}Для запуска приложения вручную используйте:${NC}"
                echo -e "${GREEN}cd frontend && npm run dev:electron:local${NC}\n"
                ;;
        esac
    else
        echo -e "${RED}Не удалось запустить локальные сервисы${NC}\n"
        exit 1
    fi
}

# Обработка сигналов для корректного завершения
trap 'echo -e "\n${YELLOW}Остановка приложения...${NC}"; docker-compose -f docker-compose.local.yml down; exit 0' INT TERM

# Запуск
main

