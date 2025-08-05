/**
 * Web server for Playwright Screenshot CLI
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { ensureDir, getFilesByExtension, parseTimestamp, isDirectory } = require('../utils/fileSystem');
const externalIpService = require('../utils/externalIp');
const portManager = require('../utils/portManager');
const logger = require('../utils/logger');
const cleanupManager = require("../utils/cleanupManager");
const { validateServerOptions } = require('../utils/validation');
const config = require('../../config/default');

class ScreenshotServer {
  constructor() {
    this.baseUrl = null; // Will be set dynamically
    this.app = express();
    this.configureMiddleware();
    this.defineRoutes();
  }

  /**
   * Configure middleware for the server
   * @private
   */
  configureMiddleware() {
    const { cors: corsConfig, csp: cspConfig } = config.security;
    if (corsConfig.enabled) {
      this.app.use(cors({ origin: corsConfig.origin }));
    }
    if (false && cspConfig.enabled) {
      this.app.use(helmet.contentSecurityPolicy({ directives: cspConfig.directives }));
    }
    
    // Serve static files from results directory with proper paths
    const resultsDir = config.screenshot.outputDir;
    console.log('Setting up static files from:', resultsDir);
    
    // Serve screenshots directly from results directory
    this.app.use('/', express.static(resultsDir, {
      dotfiles: 'ignore',
      etag: false,
      extensions: ['png', 'jpg', 'jpeg'],
      index: false,
      maxAge: '1d',
      redirect: false,
      setHeaders: function (res, path, stat) {
        res.set('x-timestamp', Date.now());
      }
    }));
    
    this.app.use(express.json());
    
    this.app.use((req, res, next) => {
      logger.info(`Request: ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Define routes for the server
   * @private
   */
  defineRoutes() {
    this.app.get('/', (req, res) => this.renderMainPage(req, res));
    this.app.get('/view/:domain/:timestamp', (req, res) => this.renderSessionPage(req, res));
    this.app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString() }));
    
    // API routes
    this.app.get('/api/stats', (req, res) => this.getStorageStats(req, res));
    this.app.delete('/api/screenshots', (req, res) => this.deleteAllScreenshots(req, res));
    
    // Direct image access route
    this.app.get('/:domain/:timestamp/:filename', (req, res) => {
      const { domain, timestamp, filename } = req.params;
      const imagePath = path.join(config.screenshot.outputDir, domain, timestamp, filename);
      
      // Check if file exists
      if (fs.existsSync(imagePath)) {
        res.sendFile(path.resolve(imagePath));
      } else {
        logger.error(`Image not found: ${imagePath}`);
        res.status(404).json({ error: 'Image not found', path: imagePath });
      }
    });
  }

  /**
   * Render main page
   * @private
   */
  /**
   * Get dynamic base URL from request
   * @private
   */
  getBaseUrl(req) {
    const protocol = req.get("x-forwarded-proto") || "http";
    const host = req.get("host");
    return `${protocol}://${host}`;
  }

  async renderMainPage(req, res) {
    try {
      const resultsDir = config.screenshot.outputDir;
      await ensureDir(resultsDir);
      const sites = await this.getSitesData(resultsDir);

      const baseUrl = this.getBaseUrl(req);
      const html = this.generateMainPageHtml({ baseUrl, sites });
      res.send(html);
    } catch (error) {
      logger.error(`Error rendering main page: ${error.message}`);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
   * Get screenshot sites and sessions data
   * @private
   */
  async getSitesData(resultsDir) {
    const siteDirs = await getFilesByExtension(resultsDir, '/');
    const sites = [];

    for (const siteDir of siteDirs) {
      const sitePath = path.join(resultsDir, siteDir);
      if (await isDirectory(sitePath)) {
        const sessions = await this.getSessionsData(sitePath);
        if (sessions.length) {
          sites.push({ name: siteDir, sessions });
        }
      }
    }

    return sites;
  }

  /**
   * Get session data for a specific site
   * @private
   */
  async getSessionsData(sitePath) {
    const sessionDirs = await getFilesByExtension(sitePath, '/');
    const sessions = [];

    for (const sessionDir of sessionDirs) {
      const sessionPath = path.join(sitePath, sessionDir);
      if (await isDirectory(sessionPath)) {
        const screenshots = await getFilesByExtension(sessionPath, '.png');

        if (screenshots.length) {
          const timestamp = sessionDir;
          const date = parseTimestamp(timestamp);
          sessions.push({
            timestamp,
            formatted: date.toLocaleString('ru-RU'),
            count: screenshots.length
          });
        }
      }
    }

    return sessions.sort((a, b) => parseTimestamp(b.timestamp) - parseTimestamp(a.timestamp));
  }

  /**
   * Generate HTML for main page
   * @private
   */
  generateMainPageHtml({ baseUrl, sites }) {
    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Screenshot Gallery</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 30px; color: #333; }
          .server-info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #2196f3; color: white; padding: 12px; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          a { color: #2196f3; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .no-data { text-align: center; padding: 40px; color: #666; }
          .site-section { margin-bottom: 30px; }
          .site-header { background: #f0f0f0; padding: 10px; font-weight: bold; border-radius: 5px; margin-bottom: 10px; }
          .controls { background: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .btn { display: inline-block; padding: 8px 16px; margin: 0 5px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; font-size: 14px; }
          .btn-danger { background: #f44336; color: white; }
          .btn-info { background: #2196f3; color: white; }
          .btn:hover { opacity: 0.8; }
          .stats { background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 10px; font-size: 12px; }
          .loading { display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🖼️ Playwright Screenshot Gallery</h1>
            <p>Профессиональный веб-интерфейс для просмотра скриншотов</p>
          </div>
          
          <div class="server-info">
            <strong>🌐 Сервер:</strong> ${baseUrl}<br>
            <strong>📁 Директория:</strong> ${config.screenshot.outputDir}/<br>
            <strong>📊 Всего сайтов:</strong> ${sites.length}
          </div>

          <div class="controls">
            <button class="btn btn-info" onclick="loadStats()">📊 Обновить статистику</button>
            <button class="btn btn-danger" onclick="confirmDeleteAll()">🗑️ Удалить все скриншоты</button>
            <div class="stats" id="stats-display"></div>
            <div class="loading" id="loading">⏳ Загрузка...</div>
          </div>


          ${sites.length === 0 ?
            '<div class="no-data">Нет доступных скриншотов</div>' :
            sites.map(site => `
              <div class="site-section">
                <div class="site-header">🌐 ${site.name}</div>
                <table>
                  <thead>
                    <tr>
                      <th>Сессия</th>
                      <th>Дата</th>
                      <th>Файлы</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${site.sessions.map(session => `
                      <tr>
                        <td><a href="${baseUrl}/view/${site.name}/${session.timestamp}">📅 ${session.formatted}</a></td>
                        <td>${session.formatted}</td>
                        <td>📊 ${session.count} скриншотов</td>
                        <td>
                          <a href="${baseUrl}/view/${site.name}/${session.timestamp}">👀 Просмотр</a>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
        </div>
              <script>
          function showLoading(show) {
            const loading = document.getElementById('loading');
            loading.style.display = show ? 'block' : 'none';
          }

          async function loadStats() {
            showLoading(true);
            try {
              const response = await fetch('/api/stats');
              const data = await response.json();
              
              if (data.success) {
                const statsDiv = document.getElementById('stats-display');
                const stats = data.stats;
                statsDiv.innerHTML = '<strong>📈 Статистика хранилища:</strong><br>' +
                  '📁 Доменов: ' + stats.domains + '<br>' +
                  '📅 Сессий: ' + stats.sessions + '<br>' +
                  '🖼️ Файлов: ' + stats.totalFiles + '<br>' +
                  '💾 Размер: ' + stats.totalSizeMB.toFixed(1) + ' МБ';
                statsDiv.style.display = 'block';
              } else {
                alert('Ошибка загрузки статистики: ' + data.message);
              }
            } catch (error) {
              alert('Ошибка соединения: ' + error.message);
            }
            showLoading(false);
          }

          function confirmDeleteAll() {
            if (confirm('ВНИМАНИЕ! Вы действительно хотите удалить ВСЕ скриншоты? Это действие нельзя отменить!')) {
              deleteAllScreenshots();
            }
          }

          async function deleteAllScreenshots() {
            showLoading(true);
            try {
              const response = await fetch('/api/screenshots', {
                method: 'DELETE'
              });
              const data = await response.json();
              
              if (data.success) {
                alert('✅ ' + data.message);
                window.location.reload();
              } else {
                alert('❌ Ошибка удаления: ' + data.message);
              }
            } catch (error) {
              alert('❌ Ошибка соединения: ' + error.message);
            }
            showLoading(false);
          }

          document.addEventListener('DOMContentLoaded', function() {
            loadStats();
          });
        </script>

      </body>
      </html>`;
  }

  /**
   * Render session page
   * @private
   */
  async renderSessionPage(req, res) {
    try {
      const { domain, timestamp } = req.params;
      const sessionDir = path.join(config.screenshot.outputDir, domain, timestamp);
      const screenshots = await getFilesByExtension(sessionDir, '.png');

      if (!screenshots.length) {
        return res.status(404).send('Session not found');
      }

      const baseUrl = this.getBaseUrl(req);
      const html = this.generateSessionPageHtml({ baseUrl, domain, timestamp, screenshots });
      res.send(html);
    } catch (error) {
      logger.error(`Error rendering session page: ${error.message}`);
      res.status(500).send('Internal Server Error');
    }
  }

  /**
  /**
   * Delete all screenshots API endpoint
   * @private
   */
  async deleteAllScreenshots(req, res) {
    try {
      const resultsDir = config.screenshot.outputDir;
      const result = await cleanupManager.deleteAllScreenshots(resultsDir);
      
      if (result.success) {
        res.json({ success: true, message: result.message, stats: result.stats });
      } else {
        res.status(500).json({ success: false, message: result.message });
      }
    } catch (error) {
      logger.error(`Error deleting screenshots: ${error.message}`);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**
   * Get storage statistics API endpoint
   * @private
   */
  async getStorageStats(req, res) {
    try {
      const resultsDir = config.screenshot.outputDir;
      const stats = await cleanupManager.getStorageStats(resultsDir);
      res.json({ success: true, stats });
    } catch (error) {
      logger.error(`Error getting storage stats: ${error.message}`);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  /**

   * Generate HTML for session page
   * @private
   */
  generateSessionPageHtml({ baseUrl, domain, timestamp, screenshots }) {
    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Screenshots - ${domain}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
          .back-link { display: inline-block; margin-bottom: 20px; color: #2196f3; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .header { text-align: center; margin-bottom: 30px; color: #333; }
          .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
          .screenshot-item { background: white; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
          .screenshot-item img { width: 100%; height: 200px; object-fit: cover; cursor: pointer; }
          .screenshot-info { padding: 15px; }
          .screenshot-name { font-weight: bold; margin-bottom: 5px; }
          .screenshot-size { color: #666; font-size: 0.9em; }
          .screenshot-url { color: #2196f3; font-size: 0.8em; margin: 5px 0; }
          .screenshot-url a { color: #2196f3; text-decoration: none; }
          .screenshot-url a:hover { text-decoration: underline; }
          .screenshot-path { color: #666; font-size: 0.8em; margin: 5px 0; word-break: break-all; }
          .screenshot-path code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="${baseUrl}" class="back-link">← Назад к списку сайтов</a>
          <div class="header">
            <h2>🌐 ${domain}</h2>
            <p>📅 ${parseTimestamp(timestamp).toLocaleString('ru-RU')}</p>
            <p>📊 Найдено скриншотов: ${screenshots.length}</p>
          </div>
          
          <div class="screenshots">
            ${screenshots.map(screenshot => {
              const localPath = path.join(config.screenshot.outputDir, domain, timestamp, screenshot);
              const webUrl = `${baseUrl}/${domain}/${timestamp}/${screenshot}`;
              
              return `
                <div class="screenshot-item">
                  <img src="${webUrl}" alt="${screenshot}" onclick="window.open('${webUrl}', '_blank')">
                  <div class="screenshot-info">
                    <div class="screenshot-name">${screenshot}</div>
                    <div class="screenshot-url">🌐 Web URL: <a href="${webUrl}" target="_blank">${webUrl}</a></div>
                    <div class="screenshot-path">📍 Local Path: <code>${localPath}</code></div>
                    <div class="screenshot-size">Нажмите для увеличения</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </body>
      </html>`;
  }

  /**
   * Start the server
   * @param {Object} options
   */
  async startServer(options = {}) {
    try {
      const validatedOptions = validateServerOptions(options);
      let port = validatedOptions.port;
      
      if (!port) {
        port = await portManager.getPort();
      }

      // Get external IP
      const ipInfo = await externalIpService.getExternalIp();
      this.baseUrl = `http://${ipInfo.ip}:${port}`;

      // Start server
      return new Promise((resolve, reject) => {
        this.serverInstance = this.app.listen(port, validatedOptions.host, () => {
          logger.info(`Server running on ${this.baseUrl}`);
          logger.info(`Results directory: ${config.screenshot.outputDir}`);
          
          resolve({
            baseUrl: this.baseUrl,
            port: port,
            ip: ipInfo.ip,
            host: validatedOptions.host
          });
        });

        this.serverInstance.on('error', (err) => {
          logger.error(`Server error: ${err.message}`);
          reject(err);
        });
      });
    } catch (err) {
      logger.error(`Failed to start server: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Export the server as a singleton instance
 */
module.exports = new ScreenshotServer();
