# 📚 Примеры использования Playwright Screenshot CLI

## 🚀 Основные команды

### Простое создание скриншота
```bash
node index.js take https://github.com
```

### Скриншот с запуском веб-сервера
```bash
node index.js take https://stackoverflow.com --server
```

### Кастомные настройки viewport
```bash
node index.js take https://google.com --width 1920 --height 1080
```

### Использование Firefox браузера
```bash
node index.js take https://example.com --browser firefox
```

### Увеличенный таймаут для медленных сайтов
```bash
node index.js take https://heavy-website.com --timeout 60000
```

### Кастомная директория для результатов
```bash
node index.js take https://github.com --output-dir ./my-screenshots
```

## 🌐 Веб-сервер команды

### Запуск сервера на определенном порту
```bash
node index.js serve --port 3000
```

### Запуск сервера после создания скриншота
```bash
node index.js take https://reddit.com --server --port 8080
```

## 🐳 Docker примеры

### Сборка Docker образа
```bash
docker build -t my-screenshot-cli .
```

### Запуск в Docker с volume маппингом
```bash
docker run -p 9000:9000 -v $(pwd)/screenshots:/app/results my-screenshot-cli
```

### Docker Compose
```yaml
version: '3.8'
services:
  screenshot-service:
    build: .
    ports:
      - "9000:9000"
    volumes:
      - ./results:/app/results
    environment:
      - PORT=9000
      - RESULTS_DIR=/app/results
```

## 📊 Полезные комбинации

### Создание скриншотов нескольких сайтов подряд
```bash
node index.js take https://github.com
node index.js take https://stackoverflow.com  
node index.js take https://google.com
node index.js serve  # Запуск сервера для просмотра всех результатов
```

### Скриншот с максимальным качеством
```bash
node index.js take https://dribbble.com --width 2560 --height 1440 --browser chromium
```

### Быстрый скриншот для тестирования
```bash
node index.js take https://httpbin.org/html --server --port 3000
```

## 🔧 Переменные окружения

```bash
# Установка переменных окружения
export PORT=8080
export RESULTS_DIR=./custom-screenshots

# Запуск с переменными окружения
node index.js serve
```

## 📱 Мобильные скриншоты

### iPhone размеры
```bash
node index.js take https://mobile-site.com --width 375 --height 812
```

### iPad размеры  
```bash
node index.js take https://tablet-site.com --width 768 --height 1024
```

### Android размеры
```bash
node index.js take https://responsive-site.com --width 360 --height 740
```

## 🎯 Специализированные случаи

### Скриншот API эндпоинта с JSON
```bash
node index.js take https://jsonplaceholder.typicode.com/posts/1
```

### Скриншот с авторизацией (если поддерживается сайтом)
```bash
node index.js take https://private-site.com --timeout 45000
```

### Скриншот SPA приложения с увеличенным таймаутом
```bash
node index.js take https://react-app.com --timeout 45000 --width 1366 --height 768
```

## 🚀 Производственное использование

### Запуск сервера в фоне с nohup
```bash
nohup node index.js serve --port 9000 > server.log 2>&1 &
```

### Систематическое создание скриншотов
```bash
#!/bin/bash
SITES=("https://github.com" "https://stackoverflow.com" "https://google.com")

for site in "${SITES[@]}"; do
    echo "Creating screenshot for $site"
    node index.js take "$site"
done

echo "Starting web server..."
node index.js serve --port 9000
```

## 📈 Мониторинг и отладка

### Проверка здоровья сервера
```bash
curl http://localhost:9000/health
```

### Просмотр логов сервера
```bash
tail -f server.log
```

### Проверка созданных скриншотов
```bash
find results/ -name "*.png" -exec ls -lh {} \;
```

## 🔍 API использование

### Получение списка всех скриншотов через curl
```bash
curl -s http://localhost:9000/ | grep -o 'href="/view/[^"]*'
```

### Скачивание конкретного скриншота
```bash
curl -O http://localhost:9000/example.com/2025-08-04T12:00:00.000Z/full_page.png
```

## ⚡ Продвинутые техники

### Создание скриншотов с разными браузерами
```bash
for browser in chromium firefox webkit; do
    node index.js take https://web-compatibility-test.com --browser "$browser" --output-dir "results-$browser"
done
```

### Автоматическое тестирование отзывчивости
```bash
#!/bin/bash
SIZES=("1920x1080" "1366x768" "768x1024" "375x812")
URL="https://responsive-design-test.com"

for size in "${SIZES[@]}"; do
    IFS='x' read -r width height <<< "$size"
    node index.js take "$URL" --width "$width" --height "$height" --output-dir "responsive-test"
done
```

Эти примеры помогут вам максимально эффективно использовать Playwright Screenshot CLI для различных задач!
