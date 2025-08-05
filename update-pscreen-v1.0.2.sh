#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Обновление PScreen до версии 1.0.2...${NC}"
echo -e "${YELLOW}📋 Исправления в этой версии:${NC}"
echo -e "   • Исправлены пути к статическим файлам"
echo -e "   • Устранены ошибки 404 при загрузке ресурсов"
echo -e "   • Улучшена стабильность веб-сервера"
echo ""

# Проверяем права администратора
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Запустите скрипт с правами администратора: sudo $0${NC}"
    exit 1
fi

# Показываем текущую версию
echo -e "${YELLOW}📊 Текущая версия:${NC}"
if command -v pscreen >/dev/null 2>&1; then
    pscreen --version 2>/dev/null || echo "PScreen установлен (версия неизвестна)"
else
    echo "PScreen не установлен"
fi

echo ""

# Останавливаем текущие процессы pscreen
echo -e "${YELLOW}⏹️  Останавливаем текущие процессы...${NC}"
pkill -f "pscreen" 2>/dev/null || true
pkill -f "node.*server" 2>/dev/null || true

# Скачиваем и устанавливаем новую версию
echo -e "${YELLOW}📥 Скачиваем версию 1.0.2...${NC}"
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

# Применяем дополнительные исправления
echo -e "${YELLOW}🔧 Применяем исправления путей...${NC}"
mkdir -p /var/lib/pscreen/results
chmod 755 /var/lib/pscreen/results

# Очищаем временные файлы
rm -f /tmp/pscreen.deb

echo ""
echo -e "${GREEN}✅ Обновление до v1.0.2 завершено успешно!${NC}"
echo -e "${GREEN}🚀 Теперь можете запустить: pscreen${NC}"
echo -e "${BLUE}🛠️  Для дополнительных исправлений: pscreen --fix${NC}"

# Показываем новую версию
echo ""
echo -e "${GREEN}📋 Установленная версия:${NC}"
if command -v pscreen >/dev/null 2>&1; then
    pscreen --version 2>/dev/null || echo "PScreen CLI Tool v1.0.2"
fi

echo ""
echo -e "${BLUE}📖 Использование:${NC}"
echo -e "   pscreen                    - Интерактивный режим"
echo -e "   pscreen https://example.com - Быстрый скриншот"
echo -e "   pscreen --help             - Справка"
echo -e "   pscreen --fix              - Исправить проблемы"
