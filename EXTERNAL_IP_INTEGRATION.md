# Интеграция модуля определения внешнего IP

## 🌍 Доступ к сервису

**URL для доступа:** http://screenshots.xproduct.ru

⚠️ **Внимание:** Сайт защищен базовой HTTP аутентификацией.

## 🔌 API эндпоинты для работы с внешним IP

### 1. Получение внешнего IP
```bash
GET /api/external-ip
```
Пример ответа:
```json
{
  "success": true,
  "data": {
    "ip": "77.73.238.240",
    "source": "fallback-service",
    "cached": false,
    "timestamp": 1754314262311
  }
}
```

### 2. Принудительное обновление IP
```bash
GET /api/external-ip?force=true
```

### 3. Информация о кеше
```bash
GET /api/cache-info
```

### 4. Очистка кеша
```bash
POST /api/cache/clear
```

### 5. Получение конфигурации
```bash
GET /api/config
```

### 6. Обновление конфигурации
```bash
POST /api/config
Content-Type: application/json

{
  "cacheTtl": 600000,
  "timeout": 10000
}
```

## 🛠️ Настройка через переменные окружения

Вы можете переопределить IP через переменную окружения:
```bash
export EXTERNAL_IP=192.168.1.100
```

## 📋 Возможности

✅ **Автоматическое определение внешнего IP** через несколько сервисов
✅ **Fallback механизм** с переменной окружения EXTERNAL_IP  
✅ **Кеширование IP** для уменьшения внешних запросов (по умолчанию 5 минут)
✅ **Конфигурационный файл** `external-ip.config.json` для переопределения настроек
✅ **Web интерфейс** с отображением текущего IP и управлением
✅ **RESTful API** для программного доступа

## 🔧 Конфигурация

Настройки находятся в файле `external-ip.config.json`:
```json
{
  "cacheTtl": 300000,
  "timeout": 5000,
  "fallbackServices": [
    "https://httpbin.org/ip",
    "https://icanhazip.com",
    "https://ifconfig.me/ip",
    "https://api.ipify.org"
  ]
}
```

## 📊 Источники IP

Модуль пытается получить IP в следующем порядке:
1. **Переменная окружения** `EXTERNAL_IP`
2. **Кеш** (если не истёк)
3. **public-ip библиотека**
4. **Fallback сервисы**
5. **Устаревший кеш** (в крайнем случае)

## 🚀 Статус

Модуль успешно интегрирован в существующий Screenshot Dashboard.
Сервер перезапущен и доступен по адресу: **http://screenshots.xproduct.ru**
