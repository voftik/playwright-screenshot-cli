/**
 * Screenshot service for creating website screenshots
 * @module cli/screenshotService
 */

const playwright = require('playwright');
const path = require('path');
const chalk = require('chalk');
const externalIpService = require('../utils/externalIp');
const net = require('net');
const cliProgress = require('cli-progress');

const { validateScreenshotOptions, extractDomain } = require('../utils/validation');
const { ensureDir, getFileSize, generateTimestamp } = require('../utils/fileSystem');
const logger = require('../utils/logger');

class ScreenshotService {
  constructor() {
    this.multibar = null;
  }

  /**
   * Take screenshots of a website
   * @param {string} url - URL to screenshot
   * @param {Object} options - Screenshot options
   * @returns {Promise<string>} Path to screenshot directory
   */
  async takeScreenshot(url, options = {}) {
    const startTime = Date.now();
    
    // Validate and normalize options
    const validatedOptions = validateScreenshotOptions({ url, ...options });
    
    const domain = extractDomain(url);
    const timestamp = generateTimestamp();
    const sessionDir = path.join(validatedOptions.outputDir, domain, timestamp);

    logger.info(`Starting screenshot capture for ${url}`);
    
    // Display initial information
    this.displayStartInfo(url, validatedOptions);
    
    // Create output directory
    await ensureDir(sessionDir);
    logger.info(`Created session directory: ${sessionDir}`);

    // Initialize progress bar
    this.initProgressBar();

    let browser;
    const screenshots = [];

    try {
      // Launch browser
      this.updateProgress(1, 'Launching browser...');
      browser = await playwright[validatedOptions.browser].launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Better Docker compatibility
      });

      // Create new page
      this.updateProgress(2, 'Creating new page...');
      const page = await browser.newPage();
      await page.setViewportSize({ 
        width: validatedOptions.width, 
        height: validatedOptions.height 
      });

      // Navigate to URL
      this.updateProgress(3, 'Navigating to page...');
      await page.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: validatedOptions.timeout 
      });

      // Take full page screenshot
      this.updateProgress(4, 'Taking full page screenshot...');
      const fullPagePath = path.join(sessionDir, 'full_page.png');
      await page.screenshot({ 
        path: fullPagePath, 
        fullPage: validatedOptions.fullPage 
      });
      
      const fullPageSize = await getFileSize(fullPagePath);
      screenshots.push({ type: 'full', path: fullPagePath, size: fullPageSize });
      
      console.log(chalk.green(`✅ Full page screenshot: ${path.relative(process.cwd(), fullPagePath)} (${fullPageSize})`));

      // Take viewport screenshots
      this.updateProgress(5, 'Taking viewport screenshots...');
      const viewportScreenshots = await this.takeViewportScreenshots(page, sessionDir, validatedOptions);
      screenshots.push(...viewportScreenshots);

      this.completeProgress();

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);

      // Display success information
      await this.displaySuccessInfo(sessionDir, screenshots, duration);
      
      logger.info(`Screenshot session completed in ${duration}s`);
      
      return sessionDir;

    } catch (error) {
      this.completeProgress();
      logger.error(`Screenshot failed: ${error.message}`);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Take viewport-sized screenshots
   * @private
   */
  async takeViewportScreenshots(page, sessionDir, options) {
    console.log(chalk.yellow('📺 Creating viewport screenshots...'));
    
    const screenshots = [];
    const fullHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = options.height;
    const screenshotCount = Math.ceil(fullHeight / viewportHeight);

    for (let i = 0; i < screenshotCount; i++) {
      const scrollTop = i * viewportHeight;
      await page.evaluate((scrollTop) => window.scrollTo(0, scrollTop), scrollTop);
      await page.waitForTimeout(500); // Wait for scroll to complete

      const viewportPath = path.join(sessionDir, `viewport_${String(i).padStart(2, '0')}.png`);
      await page.screenshot({ path: viewportPath });
      
      const size = await getFileSize(viewportPath);
      screenshots.push({ type: 'viewport', path: viewportPath, size });
      
      console.log(chalk.green(`  📱 ${path.basename(viewportPath)} (${size})`));
    }

    return screenshots;
  }

  /**
   * Initialize progress bar
   * @private
   */
  initProgressBar() {
    this.multibar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '{bar} | {percentage}% | {value}/{total} | {status}'
    }, cliProgress.Presets.shades_grey);

    this.progressBar = this.multibar.create(5, 0, { status: 'Initializing...' });
  }

  /**
   * Update progress bar
   * @private
   */
  updateProgress(value, status) {
    if (this.progressBar) {
      this.progressBar.update(value, { status });
    }
  }

  /**
   * Complete progress bar
   * @private
   */
  completeProgress() {
    if (this.multibar) {
      this.progressBar.update(5, { status: 'Complete!' });
      this.multibar.stop();
    }
  }

  /**
   * Display start information
   * @private
   */
  displayStartInfo(url, options) {
    console.log(chalk.blue.bold('🚀 Playwright Screenshot CLI'));
    console.log(chalk.gray(`🌐 URL: ${url}`));
    console.log(chalk.gray(`📁 Output: ${options.outputDir}`));
    console.log(chalk.gray(`📱 Viewport: ${options.width}x${options.height}`));
    console.log(chalk.gray(`🌐 Browser: ${options.browser}`));
    console.log(chalk.gray(`⏱️  Timeout: ${options.timeout}ms`));
    console.log();
  }

  /**
   * Display success information
   * @private
   */
  async displaySuccessInfo(sessionDir, screenshots, duration) {
    const fullPageCount = screenshots.filter(s => s.type === 'full').length;
    const viewportCount = screenshots.filter(s => s.type === 'viewport').length;
    
    // Get absolute server path
    const absoluteServerPath = path.resolve(sessionDir);
    
    // Get external IP and potential web server port
    let externalUrls = null;
    try {
      const ipInfo = await externalIpService.getExternalIp();
      const activePort = await this.findActiveWebServerPort();
      
      if (activePort) {
        const baseUrl = `http://${ipInfo.ip}:${activePort}`;
        const pathParts = sessionDir.split(path.sep);
        const domain = pathParts[pathParts.length - 2];
        const timestamp = pathParts[pathParts.length - 1];
        
        externalUrls = {
          mainPage: baseUrl,
          sessionPage: `${baseUrl}/view/${domain}/${timestamp}`,
          directImages: screenshots.map(screenshot => 
            `${baseUrl}/${domain}/${timestamp}/${path.basename(screenshot.path)}`
          )
        };
      }
    } catch (error) {
      logger.debug(`Could not determine external URLs: ${error.message}`);
    }
    
    console.log(chalk.green.bold('\n✅ Screenshots completed successfully!'));
    console.log(chalk.cyan(`📂 Relative Path: ${path.relative(process.cwd(), sessionDir)}`));
    console.log(chalk.yellow.bold(`📁 Absolute Server Path: ${absoluteServerPath}`));
    console.log(chalk.cyan(`⏱️  Duration: ${duration}s`));
    console.log(chalk.cyan(`📊 Created: ${fullPageCount} full page + ${viewportCount} viewport screenshots`));
    
    if (externalUrls) {
      console.log(chalk.green.bold('\n🌐 External URLs:'));
      console.log(chalk.blue(`📋 Main Dashboard: ${externalUrls.mainPage}`));
      console.log(chalk.magenta(`📸 Session Gallery: ${externalUrls.sessionPage}`));
      console.log(chalk.gray('🖼️  Direct Image URLs:'));
      externalUrls.directImages.forEach((url, index) => {
        const filename = path.basename(screenshots[index].path);
        console.log(chalk.gray(`   • ${filename}: ${url}`));
      });
    } else {
      console.log(chalk.yellow('\n⚠️  Web server not detected. Start with: node src/cli/index.js serve'));
    }
  }

  /**
   * Find active web server port by checking common ports
   * @private
   */
  async findActiveWebServerPort() {
    const commonPorts = [9000, 9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008, 9009, 9010];
    
    for (const port of commonPorts) {
      if (await this.isPortInUse(port)) {
        return port;
      }
    }
    return null;
  }

  /**
   * Check if port is in use
   * @private
   */
  async isPortInUse(port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, 'localhost');
    });
  }
}

module.exports = new ScreenshotService();
