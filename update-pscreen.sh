#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Обновление PScreen утилиты...${NC}"

# Проверяем права администратора
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Запустите скрипт с правами администратора: sudo $0${NC}"
    exit 1
fi

# Останавливаем текущие процессы pscreen
echo -e "${YELLOW}⏹️  Останавливаем текущие процессы...${NC}"
pkill -f "pscreen" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Скачиваем и устанавливаем новую версию
echo -e "${YELLOW}📥 Скачиваем новую версию...${NC}"
cd /tmp
wget -q --show-progress https://screenshots.xproduct.ru/pscreen.deb || {
    echo -e "${RED}❌ Ошибка скачивания пакета${NC}"
    exit 1
}

echo -e "${YELLOW}📦 Устанавливаем обновление...${NC}"
dpkg -i pscreen.deb || {
    echo -e "${YELLOW}⚠️  Исправляем зависимости...${NC}"
    apt-get install -f -y
}

# Очищаем временные файлы
rm -f /tmp/pscreen.deb

echo -e "${GREEN}✅ Обновление завершено успешно!${NC}"
echo -e "${GREEN}🚀 Теперь можете запустить: pscreen${NC}"

# Показываем версию
if command -v pscreen >/dev/null 2>&1; then
    echo -e "${GREEN}📋 Установленная версия:${NC}"
    pscreen --version 2>/dev/null || echo "PScreen CLI Tool v1.0"
fi
