#!/usr/bin/env node
/**
 * Command line interface for Playwright Screenshot CLI
 */

const { program } = require('commander');
const PlaywrightScreenshot = require('./screenshotService');
const { validateServerOptions } = require('../utils/validation');
const remoteServer = require('../server');
const logger = require('../utils/logger');

program
  .name('playwright-screenshot')
  .description('Professional screenshot CLI tool using Playwright')
  .version('2.0.0');

// Take screenshot command
program
  .command('take')
  .description('Take screenshots of a website')
  .argument('<url>', 'URL to screenshot')
  .option('-o, --output-dir <dir>', 'Output directory')
  .option('-w, --width <number>', 'Viewport width', '1280')
  .option('-h, --height <number>', 'Viewport height', '720')
  .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
  .option('-t, --timeout <number>', 'Page load timeout in ms', '30000')
  .option('--full-page', 'Take full page screenshot', false)
  .option('--server', 'Start web server after taking screenshots')
  .option('--port <number>', 'Web server port')
  .action(async (url, options) => {
    try {
      const sessionDir = await PlaywrightScreenshot.takeScreenshot(url, options);

      if (options.server) {
        const serverOptions = validateServerOptions({
          port: parseInt(options.port, 10) || undefined,
          host: options.host
        });
        
        await remoteServer.startServer({
          sessionDir,
          ...serverOptions
        });
      }
    } catch (error) {
      logger.error(`CLI Error: ${error.message}`);
      process.exit(1);
    }
  });

// Serve command
program
  .command('serve')
  .description('Start web server to view screenshots')
  .option('-p, --port <number>', 'Server port')
  .option('--host <host>', 'Server host', '0.0.0.0')
  .action(async (options) => {
    try {
      const serverOptions = validateServerOptions(options);
      await remoteServer.startServer(serverOptions);
    } catch (error) {
      logger.error(`Server Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
