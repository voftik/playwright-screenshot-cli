const { PlaywrightScreenshot } = require('./screenshot');
const PScreenServer = require('../server');
const ConfigManager = require('../config/config');
const Logger = require('./logger');

/**
 * Main PScreen library class
 */
class PScreen {
  constructor(options = {}) {
    this.configManager = new ConfigManager();
    
    // Override config with options
    if (options.outputDir) this.configManager.set('screenshot.outputDir', options.outputDir);
    if (options.width) this.configManager.set('screenshot.width', options.width);
    if (options.height) this.configManager.set('screenshot.height', options.height);
    if (options.browser) this.configManager.set('screenshot.browser', options.browser);
    
    this.logger = new Logger(this.configManager.get('logging'));
    this.screenshot = new PlaywrightScreenshot(this.configManager);
    this.server = null;
  }

  async takeScreenshot(url, options = {}) {
    return await this.screenshot.takeScreenshot(url, options);
  }

  async startServer(options = {}) {
    this.server = new PScreenServer(this.configManager);
    return await this.server.start(options.port, options.host);
  }

  async stopServer() {
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }
  }
}

module.exports = {
  PScreen,
  PlaywrightScreenshot,
  PScreenServer,
  ConfigManager,
  Logger
};
