const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced screenshot service for PScreen v2.0.0
 */
class PlaywrightScreenshot {
  constructor(configManager) {
    this.configManager = configManager;
  }

  async takeScreenshot(url, options = {}) {
    const config = {
      outputDir: options.outputDir || this.configManager.get('screenshot.outputDir'),
      width: options.width || this.configManager.get('screenshot.width'),
      height: options.height || this.configManager.get('screenshot.height'),
      fullPage: options.fullPage !== false,
      browser: options.browser || this.configManager.get('screenshot.browser'),
      timeout: options.timeout || this.configManager.get('screenshot.timeout'),
      format: options.format || this.configManager.get('screenshot.format'),
      quality: options.quality || this.configManager.get('screenshot.quality')
    };

    // Create session directory
    const domain = new URL(url).hostname;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sessionDir = path.join(config.outputDir, domain, timestamp);

    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    let browser;
    let browserType;

    try {
      // Select browser
      switch (config.browser) {
        case 'firefox':
          browserType = firefox;
          break;
        case 'webkit':
          browserType = webkit;
          break;
        default:
          browserType = chromium;
      }

      // Launch browser
      browser = await browserType.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const context = await browser.newContext({
        viewport: { width: config.width, height: config.height }
      });

      const page = await context.newPage();

      // Set timeout
      page.setDefaultTimeout(config.timeout);

      // Navigate to URL
      await page.goto(url, { waitUntil: 'networkidle' });

      const screenshots = [];

      // Take viewport screenshot
      const viewportPath = path.join(sessionDir, `viewport.${config.format}`);
      await page.screenshot({
        path: viewportPath,
        fullPage: false,
        type: config.format,
        quality: config.format === 'jpeg' ? config.quality : undefined
      });
      screenshots.push(viewportPath);

      // Take full page screenshot if requested
      if (config.fullPage) {
        const fullPagePath = path.join(sessionDir, `fullpage.${config.format}`);
        await page.screenshot({
          path: fullPagePath,
          fullPage: true,
          type: config.format,
          quality: config.format === 'jpeg' ? config.quality : undefined
        });
        screenshots.push(fullPagePath);
      }

      await browser.close();

      return {
        url,
        domain,
        timestamp,
        sessionDir,
        screenshots,
        config
      };

    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Screenshot failed for ${url}: ${error.message}`);
    }
  }
}

module.exports = { PlaywrightScreenshot };
