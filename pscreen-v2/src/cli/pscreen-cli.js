#!/usr/bin/env node

/**
 * PScreen v2.0.0 - Enhanced CLI with full automation support
 */

const { program } = require('commander');
const { PlaywrightScreenshot } = require('../lib/screenshot');
const PScreenServer = require('../server');
const ConfigManager = require('../config/config');
const Logger = require('../lib/logger');
const path = require('path');
const fs = require('fs');

// Initialize configuration and logger
const configManager = new ConfigManager();
const logger = new Logger(configManager.get('logging'));

// Enhanced error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { message: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

program
  .name('pscreen')
  .description('PScreen v2.0.0 - Professional screenshot CLI with automation support')
  .version('2.0.0');

// Main screenshot command with full automation
program
  .command('screenshot')
  .alias('take')
  .description('Take screenshots of websites')
  .argument('[url]', 'URL to screenshot (optional if using --batch)')
  .option('-u, --url <url>', 'URL to screenshot')
  .option('-o, --output <dir>', 'Output directory')
  .option('-w, --width <number>', 'Viewport width', '1920')
  .option('-h, --height <number>', 'Viewport height', '1080')
  .option('-f, --full-page', 'Take full page screenshot', true)
  .option('-b, --browser <browser>', 'Browser (chromium, firefox, webkit)', 'chromium')
  .option('-t, --timeout <number>', 'Page load timeout in ms', '30000')
  .option('--format <format>', 'Screenshot format (png, jpeg)', 'png')
  .option('--quality <number>', 'JPEG quality (1-100)', '90')
  .option('--web-server', 'Start web server after screenshots')
  .option('--no-web-server', 'Do not start web server')
  .option('--port <number>', 'Web server port', '9000')
  .option('--host <host>', 'Web server host', '0.0.0.0')
  .option('--batch <file>', 'Batch mode: read URLs from file')
  .option('--parallel <number>', 'Parallel processing limit', '1')
  .option('--retries <number>', 'Retry attempts on failure', '3')
  .option('--continue-on-error', 'Continue processing on errors')
  .option('--json', 'Output results in JSON format')
  .option('--quiet', 'Suppress non-essential output')
  .option('--verbose', 'Verbose output')
  .action(async (url, options) => {
    try {
      // Update logger settings
      if (options.quiet) logger.config.quiet = true;
      if (options.verbose) logger.config.verbose = true;
      if (options.json) logger.config.json = true;

      // Determine URLs to process
      const urls = [];
      if (url) urls.push(url);
      if (options.url) urls.push(options.url);
      
      if (options.batch) {
        if (!fs.existsSync(options.batch)) {
          logger.error(`Batch file not found: ${options.batch}`);
          process.exit(1);
        }
        const batchUrls = fs.readFileSync(options.batch, 'utf8')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        urls.push(...batchUrls);
      }

      if (urls.length === 0) {
        logger.error('No URLs specified. Use --url, provide URL as argument, or use --batch');
        process.exit(1);
      }

      // Screenshot options
      const screenshotOptions = {
        outputDir: options.output || configManager.get('screenshot.outputDir'),
        width: parseInt(options.width) || configManager.get('screenshot.width'),
        height: parseInt(options.height) || configManager.get('screenshot.height'),
        fullPage: options.fullPage !== false,
        browser: options.browser || configManager.get('screenshot.browser'),
        timeout: parseInt(options.timeout) || configManager.get('screenshot.timeout'),
        format: options.format || configManager.get('screenshot.format'),
        quality: parseInt(options.quality) || configManager.get('screenshot.quality')
      };

      const automation = {
        parallel: parseInt(options.parallel) || configManager.get('automation.parallelLimit'),
        retries: parseInt(options.retries) || configManager.get('automation.retries'),
        continueOnError: options.continueOnError || configManager.get('automation.continueOnError')
      };

      logger.info(`Starting screenshot capture for ${urls.length} URL(s)`);
      
      const results = [];
      const errors = [];

      // Process URLs with parallel limit
      const processUrl = async (url) => {
        let lastError;
        for (let attempt = 1; attempt <= automation.retries; attempt++) {
          try {
            logger.progress(`Processing ${url} (attempt ${attempt}/${automation.retries})`);
            
            const screenshot = new PlaywrightScreenshot(configManager);
            const result = await screenshot.takeScreenshot(url, screenshotOptions);
            
            results.push({ url, success: true, result });
            logger.success(`Screenshot captured: ${url}`);
            return result;
          } catch (error) {
            lastError = error;
            logger.warn(`Attempt ${attempt} failed for ${url}: ${error.message}`);
            if (attempt < automation.retries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        
        errors.push({ url, error: lastError.message });
        if (!automation.continueOnError) {
          throw lastError;
        }
        logger.error(`Failed to capture ${url}: ${lastError.message}`);
      };

      // Process URLs in batches
      for (let i = 0; i < urls.length; i += automation.parallel) {
        const batch = urls.slice(i, i + automation.parallel);
        await Promise.all(batch.map(processUrl));
      }

      // Output results
      if (options.json) {
        logger.jsonOutput({
          success: true,
          processed: urls.length,
          successful: results.length,
          failed: errors.length,
          results,
          errors
        });
      } else {
        logger.success(`Processed ${urls.length} URLs: ${results.length} successful, ${errors.length} failed`);
      }

      // Start web server if requested
      const startServer = options.webServer ?? 
        (options.noWebServer ? false : configManager.get('server.autoStart'));

      if (startServer && results.length > 0) {
        logger.info('Starting web server...');
        
        const server = new PScreenServer(configManager);
        const serverInfo = await server.start(
          parseInt(options.port) || configManager.get('server.port'),
          options.host || configManager.get('server.host')
        );

        logger.success(`Web server started: ${serverInfo.url}`);
        
        if (!options.json) {
          console.log(`\n🌐 Web server running at: ${serverInfo.url}`);
          console.log('📌 Press Ctrl+C to stop server');
        }

        // Keep server running
        const gracefulShutdown = () => {
          logger.info('Shutting down server...');
          server.stop().then(() => process.exit(0));
        };
        
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
      }

    } catch (error) {
      if (options.json) {
        logger.jsonOutput({
          success: false,
          error: error.message,
          stack: error.stack
        });
      } else {
        logger.error(`CLI Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

// Server command
program
  .command('serve')
  .description('Start web server to view screenshots')
  .option('-p, --port <number>', 'Server port')
  .option('--host <host>', 'Server host', '0.0.0.0')
  .option('--json', 'Output server info in JSON format')
  .action(async (options) => {
    try {
      const server = new PScreenServer(configManager);
      const serverInfo = await server.start(
        parseInt(options.port) || configManager.get('server.port'),
        options.host || configManager.get('server.host')
      );

      if (options.json) {
        logger.jsonOutput({ success: true, server: serverInfo });
      } else {
        logger.success(`Web server started: ${serverInfo.url}`);
        console.log('📌 Press Ctrl+C to stop server');
      }

      // Keep server running
      const gracefulShutdown = () => {
        logger.info('Shutting down server...');
        server.stop().then(() => process.exit(0));
      };
      
      process.on('SIGINT', gracefulShutdown);
      process.on('SIGTERM', gracefulShutdown);

    } catch (error) {
      if (options.json) {
        logger.jsonOutput({ success: false, error: error.message });
      } else {
        logger.error(`Server Error: ${error.message}`);
      }
      process.exit(1);
    }
  });

// Config commands
program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Create sample configuration file')
  .option('--show', 'Show current configuration')
  .option('--get <path>', 'Get configuration value')
  .option('--set <path> <value>', 'Set configuration value')
  .option('--json', 'Output in JSON format')
  .action((options) => {
    try {
      if (options.init) {
        const configPath = path.join(process.cwd(), '.pscreen.json');
        if (configManager.createSampleConfig(configPath)) {
          logger.success(`Sample configuration created: ${configPath}`);
        } else {
          logger.error('Failed to create configuration file');
          process.exit(1);
        }
      } else if (options.show) {
        if (options.json) {
          logger.jsonOutput(configManager.config);
        } else {
          console.log(JSON.stringify(configManager.config, null, 2));
        }
      } else if (options.get) {
        const value = configManager.get(options.get);
        if (options.json) {
          logger.jsonOutput({ [options.get]: value });
        } else {
          console.log(value);
        }
      } else if (options.set) {
        // This would need proper parsing for different value types
        logger.warn('Config set command not implemented yet');
      } else {
        logger.error('No config action specified. Use --init, --show, --get, or --set');
        process.exit(1);
      }
    } catch (error) {
      logger.error(`Config Error: ${error.message}`);
      process.exit(1);
    }
  });

// Debug command
program
  .command('debug')
  .description('Show debugging information')
  .option('--json', 'Output in JSON format')
  .action((options) => {
    const debugInfo = {
      version: '2.0.0',
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      config: configManager.config,
      env: {
        PSCREEN_OUTPUT_DIR: process.env.PSCREEN_OUTPUT_DIR,
        PSCREEN_PORT: process.env.PSCREEN_PORT,
        PSCREEN_LOG_LEVEL: process.env.PSCREEN_LOG_LEVEL
      }
    };

    if (options.json) {
      logger.jsonOutput(debugInfo);
    } else {
      console.log('🔍 PScreen Debug Information');
      console.log('============================');
      console.log(`Version: ${debugInfo.version}`);
      console.log(`Node.js: ${debugInfo.node}`);
      console.log(`Platform: ${debugInfo.platform}`);
      console.log(`Working directory: ${debugInfo.cwd}`);
      console.log(`Output directory: ${configManager.get('screenshot.outputDir')}`);
      console.log(`Server port: ${configManager.get('server.port')}`);
      console.log(`Log level: ${configManager.get('logging.level')}`);
    }
  });

// Parse command line arguments
program.parse();
