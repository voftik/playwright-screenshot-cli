# Реализация современных DevOps практик для Playwright Screenshotter

## ✅ Выполненные задачи

### 1. Структурированное логирование с Winston
- **Файл**: `lib/logger.js`
- **Возможности**:
  - JSON формат логов для production
  - Цветные логи для development
  - Ротация логов (максимум 10MB на файл, 5 файлов)
  - Отдельный файл для ошибок
  - Специальные методы логирования: `request`, `screenshot`, `externalIp`, `security`, `performance`

### 2. Централизованная обработка ошибок с graceful shutdown
- **Реализовано в**: `web-server.js`
- **Возможности**:
  - Graceful shutdown по SIGTERM/SIGINT
  - Обработка необработанных исключений
  - Обработка unhandled rejections
  - Настраиваемый таймаут завершения через `SHUTDOWN_TIMEOUT`

### 3. Health check endpoint
- **Endpoint**: `GET /health`
- **Возвращает**:
  - Статус сервера (UP/DOWN)
  - Время работы (uptime)
  - Использование памяти (RSS, heap)
  - Текущее окружение
  - Временная метка

### 4. Метрики производительности (Prometheus)
- **Файл**: `lib/metrics.js`
- **Endpoint**: `GET /metrics`
- **Метрики**:
  - HTTP запросы (продолжительность, счетчики)
  - Операции скриншотов
  - Проверки внешнего IP
  - Стандартные метрики Node.js (память, CPU, etc.)

### 5. Поддержка переменных окружения
- **Файл**: `.env`
- **Переменные**:
  - `PORT` - порт сервера
  - `NODE_ENV` - окружение
  - `LOG_LEVEL` - уровень логирования
  - `LOG_FILE` - путь к файлу логов
  - `SHUTDOWN_TIMEOUT` - таймаут graceful shutdown
  - `RESULTS_DIR` - директория результатов
  - И другие...

### 6. Улучшенный UI/UX
- **Шаблонизатор**: EJS
- **Файлы**:
  - `templates/layout.ejs` - основной макет
  - `templates/content.ejs` - контент главной страницы
  - `templates/view-session.ejs` - просмотр сессии
  - `lib/templateRenderer.js` - рендерер шаблонов

#### UI улучшения:
- Боковая панель навигации
- Современные CSS стили
- Лайтбокс для просмотра изображений
- Таблица сессий с фильтрацией
- Responsive дизайн

## 🚀 Как использовать

### Запуск сервера
```bash
npm start
# или
node web-server.js
```

### Доступные endpoints

#### DevOps endpoints:
- `GET /health` - проверка состояния
- `GET /metrics` - метрики Prometheus

#### Основные endpoints:
- `GET /` - главная страница с dashboard
- `GET /view/:domain/:session` - просмотр сессии
- `GET /static/*` - статические файлы
- `GET /api/external-ip` - внешний IP
- `GET /api/config` - конфигурация

### Просмотр логов
```bash
# Просмотр основных логов
tail -f logs/app.log

# Просмотр ошибок
tail -f logs/error.log

# Через npm script
npm run logs
```

## 📊 Мониторинг

### Prometheus метрики
Сервер экспортирует метрики в формате Prometheus на `/metrics`:
- `http_request_duration_ms` - продолжительность HTTP запросов
- `http_requests_total` - общее количество HTTP запросов
- `screenshots_total` - общее количество скриншотов
- `screenshot_duration_ms` - продолжительность операций скриншота
- `external_ip_checks_total` - проверки внешнего IP
- Стандартные метрики Node.js

### Health check
Endpoint `/health` возвращает состояние сервера в JSON формате.

## 🔧 Конфигурация

Все основные настройки можно изменить через файл `.env`:

```env
PORT=9000
NODE_ENV=development
LOG_LEVEL=info
LOG_FILE=./logs/app.log
SHUTDOWN_TIMEOUT=30000
RESULTS_DIR=./results
```

## 🎯 Результат

Приложение теперь соответствует современным DevOps практикам:
- ✅ Структурированное логирование
- ✅ Graceful shutdown
- ✅ Health checks
- ✅ Metrics для мониторинга
- ✅ Конфигурация через переменные окружения
- ✅ Улучшенный пользовательский интерфейс

Приложение готово для production использования и интеграции с системами мониторинга.
