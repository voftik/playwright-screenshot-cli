const path = require('path');
const fs = require('fs').promises;

/**
 * Simple template renderer for error pages
 */
class TemplateRenderer {
  constructor(templatesDir = path.join(__dirname, '..', 'templates')) {
    this.templatesDir = templatesDir;
  }

  /**
   * Render a simple error page
   */
  async renderErrorPage(templateName, data = {}) {
    try {
      // Simple HTML error page
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Error</h1>
          <p>Failed to render template: ${templateName}</p>
          <p>Error: ${data.error || 'Unknown error'}</p>
        </body>
        </html>
      `;
    } catch (error) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
        </head>
        <body>
          <h1>Critical Error</h1>
          <p>Template rendering failed</p>
        </body>
        </html>
      `;
    }
  }

  /**
   * Render main page template
   */
  async renderMainPage(data = {}) {
    const shots = data.screenshots || [];
    
    const shotsHtml = shots.map(shot => `
      <div class="screenshot-item">
        <div class="screenshot-info">
          <div class="site-name">🌐 ${shot.site}</div>
          <div class="timestamp">📅 ${new Date(shot.created).toLocaleString('ru-RU')}</div>
        </div>
        <div class="file-size">📁 ${(shot.size / 1024).toFixed(1)} KB</div>
        <img src="${shot.path}" alt="${shot.site} screenshot" class="screenshot-img" 
             onclick="window.open('${shot.path}', '_blank')" />
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Screenshots</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .screenshot-item { border: 1px solid #ddd; margin: 10px 0; padding: 10px; }
          .screenshot-img { max-width: 200px; cursor: pointer; }
          .site-name { font-weight: bold; }
          .timestamp { color: #666; }
        </style>
      </head>
      <body>
        <h1>Screenshots</h1>
        ${shotsHtml || '<p>No screenshots found</p>'}
      </body>
      </html>
    `;
  }
}

module.exports = TemplateRenderer;
