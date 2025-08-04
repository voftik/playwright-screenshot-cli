const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 9000;
const RESULTS_DIR = path.join(__dirname, 'results');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Логирование
app.use((req, res, next) => {
  console.log(new Date().toISOString() + ' - ' + req.method + ' ' + req.url);
  next();
});

// Создаем папку для результатов
async function ensureResultsDir() {
  try {
    await fs.access(RESULTS_DIR);
  } catch {
    await fs.mkdir(RESULTS_DIR, { recursive: true });
  }
}

// API для получения списка скриншотов
app.get('/api/screenshots', async (req, res) => {
  try {
    await ensureResultsDir();
    const files = await fs.readdir(RESULTS_DIR);
    const screenshots = [];
    
    for (const file of files) {
      if (file.endsWith('.png')) {
        const filePath = path.join(RESULTS_DIR, file);
        const stats = await fs.stat(filePath);
        screenshots.push({
          name: file,
          path: '/results/' + file,
          size: stats.size,
          created: stats.birthtime,
          site: file.replace(/_\d+\.png$/, '').replace(/_/g, '.')
        });
      }
    }
    
    screenshots.sort((a, b) => new Date(b.created) - new Date(a.created));
    res.json(screenshots);
  } catch (error) {
    console.error('Error loading screenshots:', error);
    res.status(500).json({ error: 'Failed to load screenshots' });
  }
});

// Главная страница
app.get('/', async (req, res) => {
  const html = `<!DOCTYPE html>
<html>
<head>
    <title>Screenshot Viewer</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; text-align: center; }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .screenshot-item { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
        .screenshot-info { padding: 15px; }
        .site-name { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
        .timestamp { color: #7f8c8d; font-size: 14px; margin-bottom: 5px; }
        .file-size { color: #95a5a6; font-size: 12px; }
        .screenshot-img { width: 100%; height: 200px; object-fit: cover; cursor: pointer; }
        .loading { text-align: center; padding: 40px; color: #7f8c8d; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📸 Screenshot Viewer</h1>
        <div id="content" class="loading">Loading screenshots...</div>
    </div>
    <script>
        fetch('/api/screenshots')
          .then(r => r.json())
          .then(shots => {
            const content = document.getElementById('content');
            if (shots.length === 0) {
              content.innerHTML = '<div class="loading">No screenshots found</div>';
              return;
            }
            const html = shots.map(shot => 
              '<div class="screenshot-item">' +
                '<div class="screenshot-info">' +
                  '<div class="site-name">🌐 ' + shot.site + '</div>' +
                  '<div class="timestamp">📅 ' + new Date(shot.created).toLocaleString() + '</div>' +
                  '<div class="file-size">📁 ' + (shot.size / 1024).toFixed(1) + ' KB</div>' +
                '</div>' +
                '<img src="' + shot.path + '" alt="' + shot.site + '" class="screenshot-img" onclick="window.open(this.src)">' +
              '</div>'
            ).join('');
            content.innerHTML = '<div class="screenshots">' + html + '</div>';
          })
          .catch(e => {
            document.getElementById('content').innerHTML = '<div class="loading">Error loading screenshots</div>';
          });
    </script>
</body>
</html>`;
  res.send(html);
});

// Статические файлы
app.use('/results', express.static(RESULTS_DIR));

// Health check  
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log('Screenshot viewer server running on http://0.0.0.0:' + PORT);
  console.log('Results directory: ' + RESULTS_DIR);
});

module.exports = app;
