/**
 * Web server for Playwright Screenshot CLI
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { ensureDir, getFilesByExtension, parseTimestamp } = require('../utils/fileSystem');
const externalIpService = require('../utils/externalIp');
const portManager = require('../utils/portManager');
const logger = require('../utils/logger');
const { validateServerOptions } = require('../utils/validation');
const config = require('../../config/default');

class ScreenshotServer {
  constructor() {
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
    if (cspConfig.enabled) {
      this.app.use(helmet.contentSecurityPolicy({ directives: cspConfig.directives }));
    }
    this.app.use(express.static('static'));
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
  }

  /**
   * Render main page
   * @private
   */
  async renderMainPage(req, res) {
    const resultsDir = path.join(process.cwd(), config.screenshot.outputDir);
    await ensureDir(resultsDir);
    const sites = await this.getSitesData(resultsDir);

    const html = this.generateMainPageHtml({ baseUrl: this.baseUrl, sites });
    res.send(html);
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
      const sessions = await this.getSessionsData(sitePath);
      if (sessions.length) {
        sites.push({ name: siteDir, sessions });
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
            <strong>📁 Директория:</strong> results/
          </div>

          ${sites.length === 0 ?
            '<div class="no-data">Нет доступных скриншотов</div>' :
             sites.map(site => `
              <table>
                <thead>
                  <tr>
                    <th>Домен</th>
                    <th>Сессия</th>
                    <th>Дата</th>
                    <th>Файлы</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  ${site.sessions.map(session => `
                    <tr>
                      <td>🌐 ${site.name}</td>
                      <td><a href="${baseUrl}/view/${site.name}/${session.timestamp}">📅 ${session.formatted}</a></td>
                      <td>${session.formatted}</td>
                      <td>📊 ${session.count} скриншотов</td>
                      <td>
                        <a href="${baseUrl}/view/${site.name}/${session.timestamp}">👀 Просмотр</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`).join('')}
        </div>
      </body>
      </html>`;
  }

  /**
   * Render session page
   * @private
   */
  async renderSessionPage(req, res) {
    const { domain, timestamp } = req.params;
    const sessionDir = path.join(process.cwd(), config.screenshot.outputDir, domain, timestamp);
    const screenshots = await getFilesByExtension(sessionDir, '.png');

    if (!screenshots.length) {
      return res.status(404).send('Session not found');
    }

    const html = this.generateSessionPageHtml({ baseUrl: this.baseUrl, domain, timestamp, screenshots });
    res.send(html);
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
        </style>
      </head>
      <body>
        <div class="container">
          <a href="${baseUrl}" class="back-link">← Назад к списку сайтов</a>
          <div class="header">
            <h2>🌐 ${domain}</h2>
            <p>📅 ${parseTimestamp(timestamp).toLocaleString('ru-RU')}</p>
          </div>
          
          <div class="screenshots">
            ${screenshots.map(screenshot => `
              <div class="screenshot-item">
                <img src="${baseUrl}/${domain}/${timestamp}/${screenshot}" alt="${screenshot}" onclick="window.open('${baseUrl}/${domain}/${timestamp}/${screenshot}', '_blank')">
                <div class="screenshot-info">
                  <div class="screenshot-name">${screenshot}</div>
                  <div class="screenshot-size">${parseInt(screenshot.size / 1024)} KB</div>
                </div>
              </div>
            `).join('')}
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
      const port = validatedOptions.port || await portManager.getPort();

      // Get external IP
      const ipInfo = await externalIpService.getExternalIp();
      this.baseUrl = `http://${ipInfo.ip}:${port}`;

      // Start server
      this.serverInstance = this.app.listen(port, validatedOptions.host, () => {
        logger.info(`Server running on ${this.baseUrl}`);
        logger.info(`Results directory: ${path.join(process.cwd(), config.screenshot.outputDir)}`);
      });

      this.serverInstance.on('error', (err) => {
        logger.error(`Server error: ${err.message}`);
        throw err;
      });
    } catch (err) {
      logger.error(`Failed to start server: ${err.message}`);
      throw err;
    }
  }
}

/**
 * Export the server as a singleton instance
 * @module
 */
module.exports = new ScreenshotServer();
