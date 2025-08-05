const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced PScreen server for v2.0.0
 */
class PScreenServer {
  constructor(configManager) {
    this.configManager = configManager;
    this.config = this.configManager.get('server');
    this.logger = require('../lib/logger');
    this.app = express();
    this.server = http.createServer(this.app);
    this.resultsDir = this.configManager.get('screenshot.outputDir');

    // Setup middleware
    this.setupMiddleware();
    // Setup routes
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS setup
    if (this.configManager.get('security.cors.enabled')) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', this.configManager.get('security.cors.origin'));
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        if (req.method === 'OPTIONS') {
          return res.sendStatus(200);
        }
        next();
      });
    }

    // Static files
    this.app.use(this.config.staticPath, express.static(this.resultsDir));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        version: '2.0.0',
        uptime: process.uptime(),
        resultsDir: this.resultsDir
      });
    });

    // API endpoint for screenshot list
    this.app.get('/api/screenshots', (req, res) => {
      try {
        const domains = this.getScreenshotData();
        res.json({ success: true, data: domains });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Main dashboard
    this.app.get('/', (req, res) => {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      try {
        const domains = this.getScreenshotData();
        
        const html = this.generateDashboardHTML(baseUrl, domains);
        res.send(html);
      } catch (error) {
        res.status(500).send(`Error loading dashboard: ${error.message}`);
      }
    });

    // View domain screenshots
    this.app.get('/view/:domain', (req, res) => {
      const { domain } = req.params;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      try {
        const domainData = this.getDomainData(domain);
        const html = this.generateDomainHTML(baseUrl, domain, domainData);
        res.send(html);
      } catch (error) {
        res.status(404).send(`Domain not found: ${error.message}`);
      }
    });
  }

  getScreenshotData() {
    if (!fs.existsSync(this.resultsDir)) {
      return [];
    }

    return fs.readdirSync(this.resultsDir)
      .filter(item => fs.statSync(path.join(this.resultsDir, item)).isDirectory())
      .map(domain => {
        const domainDir = path.join(this.resultsDir, domain);
        let sessions = [];
        
        try {
          sessions = fs.readdirSync(domainDir)
            .filter(item => fs.statSync(path.join(domainDir, item)).isDirectory())
            .sort()
            .reverse();
        } catch (error) {
          console.error(`Error reading domain ${domain}:`, error.message);
        }
        
        return {
          domain,
          sessions: sessions.length,
          lastSession: sessions[0] || null
        };
      })
      .slice(0, 20);
  }

  getDomainData(domain) {
    const domainDir = path.join(this.resultsDir, domain);
    
    if (!fs.existsSync(domainDir)) {
      throw new Error('Domain directory not found');
    }

    const sessions = fs.readdirSync(domainDir)
      .filter(item => fs.statSync(path.join(domainDir, item)).isDirectory())
      .sort()
      .reverse()
      .map(session => {
        const sessionDir = path.join(domainDir, session);
        const screenshots = fs.readdirSync(sessionDir)
          .filter(file => file.endsWith('.png'))
          .map(file => ({
            name: file,
            path: `/static/${domain}/${session}/${file}`
          }));
        
        return {
          session,
          screenshots
        };
      });

    return sessions;
  }

  generateDashboardHTML(baseUrl, domains) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PScreen v2.0.0 Dashboard</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8f9fa; }
      .header { background: #007bff; color: white; padding: 1rem 2rem; }
      .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }
      .stat-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .domains-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
      .domain-card { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #007bff; }
      .domain-card h3 { margin: 0 0 1rem 0; color: #333; }
      .domain-card a { color: #007bff; text-decoration: none; font-weight: 500; }
      .domain-card a:hover { text-decoration: underline; }
      .no-data { text-align: center; color: #666; padding: 3rem; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 PScreen v2.0.0 Dashboard</h1>
        <p>Professional screenshot management with automation support</p>
    </div>
    
    <div class="container">
        <div class="stats">
            <div class="stat-card">
                <h3>📊 Total Domains</h3>
                <p><strong>${domains.length}</strong></p>
            </div>
            <div class="stat-card">
                <h3>📁 Results Directory</h3>
                <p><code>${this.resultsDir}</code></p>
            </div>
            <div class="stat-card">
                <h3>🌐 Server URL</h3>
                <p><code>${baseUrl}</code></p>
            </div>
            <div class="stat-card">
                <h3>⏱️ Uptime</h3>
                <p>${Math.floor(process.uptime())} seconds</p>
            </div>
        </div>

        <h2>📸 Screenshot Domains</h2>
        ${domains.length > 0 ? `
            <div class="domains-grid">
                ${domains.map(item => `
                    <div class="domain-card">
                        <h3><a href="/view/${item.domain}">📸 ${item.domain}</a></h3>
                        <p><strong>Sessions:</strong> ${item.sessions}</p>
                        <p><strong>Last captured:</strong> ${item.lastSession || 'Never'}</p>
                    </div>
                `).join('')}
            </div>
        ` : '<div class="no-data">No screenshots found. Take your first screenshot!</div>'}
    </div>
</body>
</html>`;
  }

  generateDomainHTML(baseUrl, domain, sessions) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screenshots - ${domain}</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8f9fa; }
      .header { background: #007bff; color: white; padding: 1rem 2rem; }
      .container { max-width: 1200px; margin: 2rem auto; padding: 0 2rem; }
      .back-link { display: inline-block; margin-bottom: 2rem; color: #007bff; text-decoration: none; font-weight: 500; }
      .back-link:hover { text-decoration: underline; }
      .session { background: white; margin: 2rem 0; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      .session h3 { margin: 0 0 1rem 0; color: #333; border-bottom: 2px solid #007bff; padding-bottom: 0.5rem; }
      .screenshots { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
      .screenshot { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
      .screenshot img { width: 100%; height: auto; display: block; }
      .screenshot-info { padding: 1rem; background: #f8f9fa; }
      .screenshot-info h4 { margin: 0 0 0.5rem 0; font-size: 0.9rem; }
      .screenshot-info a { color: #007bff; text-decoration: none; font-size: 0.8rem; }
      .screenshot-info a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Screenshots for ${domain}</h1>
    </div>
    
    <div class="container">
        <a href="/" class="back-link">← Back to Dashboard</a>
        
        ${sessions.length > 0 ? sessions.map(session => `
            <div class="session">
                <h3>📅 Session: ${session.session}</h3>
                ${session.screenshots.length > 0 ? `
                    <div class="screenshots">
                        ${session.screenshots.map(screenshot => `
                            <div class="screenshot">
                                <a href="${baseUrl}${screenshot.path}" target="_blank">
                                    <img src="${baseUrl}${screenshot.path}" alt="${screenshot.name}" loading="lazy">
                                </a>
                                <div class="screenshot-info">
                                    <h4>${screenshot.name}</h4>
                                    <a href="${baseUrl}${screenshot.path}" target="_blank">🔗 Open full size</a>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No screenshots found in this session</p>'}
            </div>
        `).join('') : '<p>No sessions found for this domain</p>'}
    </div>
</body>
</html>`;
  }

  async start(port = this.config.port, host = this.config.host) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            port,
            host,
            url: `http://${host}:${port}`
          });
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.server.close(() => {
        resolve();
      });
    });
  }
}

module.exports = PScreenServer;
