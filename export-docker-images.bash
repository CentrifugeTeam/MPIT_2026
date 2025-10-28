#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Экспорт Docker образов${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}⚠️  ВАЖНО: Этот скрипт нужно запустить ОДИН РАЗ на машине с интернетом${NC}"
echo -e "${YELLOW}   для подготовки offline-версии приложения${NC}\n"

# Создаем директорию для образов
IMAGES_DIR="docker-images"
mkdir -p "$IMAGES_DIR"

echo -e "${BLUE}[1/6]${NC} Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker не установлен${NC}\n"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}✗ Docker daemon не запущен${NC}\n"
    exit 1
fi
echo -e "${GREEN}✓ Docker работает${NC}\n"

# Функция для скачивания и экспорта образа
export_base_image() {
    local image_name=$1
    local file_name=$2

    echo -e "${YELLOW}Обработка $image_name...${NC}"

    # Скачиваем образ
    echo -e "  ${BLUE}→ Скачивание образа...${NC}"
    if docker pull "$image_name" &> /dev/null; then
        echo -e "  ${GREEN}✓ Образ скачан${NC}"
    else
        echo -e "  ${RED}✗ Ошибка скачивания${NC}"
        return 1
    fi

    # Экспортируем в tar
    echo -e "  ${BLUE}→ Экспорт в файл...${NC}"
    if docker save "$image_name" -o "$IMAGES_DIR/$file_name"; then
        local size=$(du -h "$IMAGES_DIR/$file_name" | cut -f1)
        echo -e "  ${GREEN}✓ Сохранено: $file_name ($size)${NC}\n"
    else
        echo -e "  ${RED}✗ Ошибка экспорта${NC}\n"
        return 1
    fi
}

# Функция для сборки и экспорта кастомного образа
build_and_export_service() {
    local service_name=$1
    local context_dir=$2
    local use_target=$3  # "yes" если нужен --target development
    local image_tag="$service_name:local"
    local file_name="$service_name.tar"

    echo -e "${YELLOW}Обработка $service_name...${NC}"

    # Собираем образ
    echo -e "  ${BLUE}→ Сборка образа...${NC}"

    # Формируем команду сборки
    if [ "$use_target" = "yes" ]; then
        BUILD_CMD="docker build -t $image_tag -f $context_dir/Dockerfile --target development $context_dir"
    else
        BUILD_CMD="docker build -t $image_tag -f $context_dir/Dockerfile $context_dir"
    fi

    if $BUILD_CMD > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Образ собран${NC}"
    else
        echo -e "  ${RED}✗ Ошибка сборки${NC}"
        echo -e "  ${YELLOW}Попробуйте запустить вручную:${NC}"
        echo -e "  ${BLUE}$BUILD_CMD${NC}\n"
        return 1
    fi

    # Экспортируем в tar
    echo -e "  ${BLUE}→ Экспорт в файл...${NC}"
    if docker save "$image_tag" -o "$IMAGES_DIR/$file_name"; then
        local size=$(du -h "$IMAGES_DIR/$file_name" | cut -f1)
        echo -e "  ${GREEN}✓ Сохранено: $file_name ($size)${NC}\n"
    else
        echo -e "  ${RED}✗ Ошибка экспорта${NC}\n"
        return 1
    fi
}

echo -e "${BLUE}[2/6]${NC} Экспорт базовых образов...\n"

# Экспортируем postgres
export_base_image "postgres:15" "postgres-15.tar"

echo -e "${BLUE}[3/6]${NC} Сборка и экспорт bff-service...\n"
build_and_export_service "bff-service" "./bff-service" "yes"

echo -e "${BLUE}[4/6]${NC} Сборка и экспорт files-service...\n"
build_and_export_service "files-service" "./files-service" "no"

echo -e "${BLUE}[5/6]${NC} Сборка и экспорт projects-service...\n"
build_and_export_service "projects-service" "./projects-service" "no"

echo -e "${BLUE}[6/6]${NC} Сборка и экспорт generator-service...\n"
build_and_export_service "generator-service" "./generator-service" "no"

# Подсчет общего размера
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Результаты экспорта${NC}"
echo -e "${BLUE}========================================${NC}\n"

TOTAL_SIZE=$(du -sh "$IMAGES_DIR" | cut -f1)
echo -e "${GREEN}✓ Все образы успешно экспортированы${NC}"
echo -e "${BLUE}Общий размер:${NC} ${GREEN}$TOTAL_SIZE${NC}\n"

echo -e "${BLUE}Список файлов:${NC}"
ls -lh "$IMAGES_DIR"/*.tar | awk '{print "  " $9 " - " $5}'
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Экспорт завершен!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${YELLOW}Следующие шаги:${NC}"
echo -e "  ${GREEN}1.${NC} Добавьте папку ${BLUE}docker-images/${NC} в git:"
echo -e "     ${BLUE}git add docker-images/${NC}"
echo -e "     ${BLUE}git commit -m \"Add Docker images for offline mode\"${NC}"
echo -e "     ${BLUE}git push${NC}"
echo -e "  ${GREEN}2.${NC} Используйте ${BLUE}local.bash${NC} для offline запуска\n"

echo -e "${YELLOW}⚠️  Примечание:${NC}"
echo -e "  Образы займут ~1.5-2 GB в репозитории."
echo -e "  Это нормально для offline режима.\n"

