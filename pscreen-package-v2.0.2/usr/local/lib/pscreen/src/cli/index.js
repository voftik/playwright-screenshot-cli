#!/usr/bin/env node
/**
 * Command line interface for Playwright Screenshot CLI
 */

const { program } = require('commander');
const PlaywrightScreenshot = require('./screenshotService');
const { validateServerOptions } = require('../utils/validation');
const remoteServer = require('../server');
const logger = require('../utils/logger');
const firewallManager = require("../utils/firewallManager");
const chalk = require('chalk');
const path = require('path');

program
  .name('playwright-screenshot')
  .description('Professional screenshot CLI tool using Playwright')
  .version('2.0.2');

// Take screenshot command
program
  .command('take')
  .description('Take screenshots of a website')
  .argument('<url>', 'URL to screenshot')
  .option('-o, --output-dir <dir>', 'Output directory', 'results')
  .option('-w, --width <number>', 'Viewport width', '1280')
  .option('-h, --height <number>', 'Viewport height', '720')
  .option('-b, --browser <browser>', 'Browser to use (chromium, firefox, webkit)', 'chromium')
  .option('-t, --timeout <number>', 'Page load timeout in ms', '30000')
  .option('--full-page', 'Take full page screenshot', true)
  .option('--server', 'Start web server after taking screenshots')
  .option('--port <number>', 'Web server port')
  .action(async (url, options) => {
    try {
      // Convert string options to proper types
      const screenshotOptions = {
        url,
        outputDir: options.outputDir,
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10),
        browser: options.browser,
        timeout: parseInt(options.timeout, 10),
        fullPage: options.fullPage
      };

      const sessionDir = await PlaywrightScreenshot.takeScreenshot(url, screenshotOptions);

      if (options.server) {
        const serverOptions = validateServerOptions({
          port: options.port ? parseInt(options.port, 10) : undefined,
          host: options.host
        });
        
        const serverInfo = await remoteServer.startServer({
          sessionDir,
          ...serverOptions
        });

        // Extract domain and timestamp from sessionDir for URL
        const pathParts = sessionDir.split(path.sep);
        const domain = pathParts[pathParts.length - 2];
        const timestamp = pathParts[pathParts.length - 1];
        
        console.log(chalk.green.bold('\n🌐 Веб-сервер успешно запущен!'));
        console.log(chalk.cyan.bold(`📋 Главная страница: ${serverInfo.baseUrl}`));
        console.log(chalk.yellow.bold(`📸 Прямая ссылка на ваши скриншоты: ${serverInfo.baseUrl}/view/${domain}/${timestamp}`));
        console.log(chalk.gray(`🔧 Сервер работает на порту ${serverInfo.port}`));
        console.log(chalk.gray(`🌍 Внешний IP: ${serverInfo.ip}`));
        
        // Keep server running
        console.log(chalk.blue('\n📌 Сервер работает. Нажмите Ctrl+C для остановки.'));
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log(chalk.yellow('\n🛑 Остановка сервера...'));
          process.exit(0);
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
      const serverOptions = validateServerOptions({
        port: options.port ? parseInt(options.port, 10) : undefined,
        host: options.host
      });
      
      // Check and configure firewall
      const port = serverOptions.port || 9000;
      const firewallResult = await firewallManager.ensurePortAccess(port);
      if (firewallResult.ruleAdded) {
        console.log(chalk.yellow(`🔥 Added firewall rule: ${firewallResult.message}`));
      } else if (!firewallResult.success) {
        console.log(chalk.red(`⚠️  Firewall warning: ${firewallResult.message}`));
      }

      const serverInfo = await remoteServer.startServer(serverOptions);
      
      console.log(chalk.green.bold('🌐 Веб-сервер успешно запущен!'));
      console.log(chalk.cyan.bold(`📋 Главная страница: ${serverInfo.baseUrl}`));
      console.log(chalk.gray(`🔧 Сервер работает на порту ${serverInfo.port}`));
      console.log(chalk.gray(`🌍 Внешний IP: ${serverInfo.ip}`));
      
      // Keep server running
      console.log(chalk.blue('\n📌 Сервер работает. Нажмите Ctrl+C для остановки.'));
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Остановка сервера...'));
        process.exit(0);
      });
      
    } catch (error) {
      logger.error(`Server Error: ${error.message}`);
      process.exit(1);
    }
  });


// Show detailed results command  
const detailsCommand = require('./detailsCommand');

program
  .command('details')
  .description('Show detailed information about recent screenshots')
  .argument('[sessionDir]', 'Session directory (optional, will use most recent if not provided)')
  .option('--baseUrl <url>', 'Base URL for web links')
  .action(async (sessionDir, options) => {
    try {
      if (!sessionDir) {
        sessionDir = await detailsCommand.findMostRecentSession();
      }
      
      if (!sessionDir || !require('fs').existsSync(sessionDir)) {
        console.log(chalk.red('❌ No screenshot sessions found'));
        return;
      }
      
      await detailsCommand.displayDetailedResults(sessionDir, options.baseUrl);
      
    } catch (error) {
      logger.error(`Details Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Cleanup command
const cleanupManager = require('../utils/cleanupManager');

program
  .command('cleanup')
  .description('Clean up screenshots and manage storage')
  .option('--all', 'Delete all screenshots')
  .option('--days <days>', 'Delete screenshots older than specified days', '7')
  .option('--stats', 'Show storage statistics only')
  .action(async (options) => {
    try {
      const resultsDir = path.join(process.cwd(), 'results');
      
      if (options.stats) {
        const stats = await cleanupManager.getStorageStats(resultsDir);
        console.log(chalk.cyan.bold('\n📊 Storage Statistics:'));
        console.log(chalk.green(`📁 Domains: ${stats.domains}`));
        console.log(chalk.green(`📸 Sessions: ${stats.sessions}`)); 
        console.log(chalk.green(`🗂️ Total files: ${stats.totalFiles}`));
        console.log(chalk.green(`💾 Total size: ${stats.totalSizeMB.toFixed(1)} MB`));
        return;
      }
      
      if (options.all) {
        const stats = await cleanupManager.getStorageStats(resultsDir);
        console.log(chalk.yellow.bold('\n⚠️ WARNING: This will delete ALL screenshots!'));
        console.log(chalk.gray(`📁 ${stats.domains} domains, ${stats.sessions} sessions, ${stats.totalFiles} files (${stats.totalSizeMB.toFixed(1)} MB)`));
        
        // In a real CLI, you'd prompt for confirmation here
        console.log(chalk.red.bold('🗑️ Deleting all screenshots...'));
        
        const result = await cleanupManager.deleteAllScreenshots(resultsDir);
        if (result.success) {
          console.log(chalk.green.bold(`✅ ${result.message}`));
        } else {
          console.log(chalk.red.bold(`❌ ${result.message}`));
        }
      } else {
        const days = parseInt(options.days);
        console.log(chalk.yellow.bold(`\n🧹 Cleaning up screenshots older than ${days} days...`));
        
        const result = await cleanupManager.deleteOldScreenshots(resultsDir, days);
        if (result.success) {
          console.log(chalk.green.bold(`✅ ${result.message}`));
        } else {
          console.log(chalk.red.bold(`❌ ${result.message}`));
        }
      }
      
    } catch (error) {
      logger.error(`Cleanup Error: ${error.message}`);
      process.exit(1);
    }
  });
