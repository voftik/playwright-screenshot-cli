FROM node:20-alpine

# Установка необходимых системных зависимостей
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Создание рабочей директории
WORKDIR /app

# Копирование package файлов
COPY package*.json ./

# Установка Node.js зависимостей
RUN npm ci --only=production

# Установка Playwright браузеров
RUN npx playwright install chromium
RUN npx playwright install firefox
RUN npx playwright install webkit

# Копирование исходного кода
COPY . .

# Создание директории для результатов
RUN mkdir -p results

# Настройка переменных окружения
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin

# Экспонирование порта
EXPOSE 9000

# Настройка пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S playwright -u 1001
RUN chown -R playwright:nodejs /app
USER playwright

# Команда по умолчанию
CMD ["node", "index.js", "serve", "--port", "9000"]
