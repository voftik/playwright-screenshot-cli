#!/usr/bin/env node

/**
 * Robust CLI for PScreen with enhanced error handling
 */

const { program } = require('commander');
const PlaywrightScreenshot = require('./screenshotService');
const { validateServerOptions } = require('../utils/validation');
const logger = require('../utils/logger');
const firewallManager = require("../utils/firewallManager");
const chalk = require('chalk');
const path = require('path');

// Enhanced error handling
process.on('uncaughtException', (error) => {
  console.error(chalk.red('🚨 Uncaught Exception:'), error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('🚨 Unhandled Rejection at:'), promise);
  console.error('Reason:', reason);
  process.exit(1);
});

program
  .name('pscreen')
  .description('Professional screenshot CLI tool using Playwright')
  .version('1.0.3');

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
      console.log(chalk.blue('🎯 Starting screenshot capture...'));
      console.log(chalk.gray(`URL: ${url}`));
      
      // Convert string options to proper types with validation
      const screenshotOptions = {
        url,
        outputDir: options.outputDir,
        width: parseInt(options.width, 10) || 1280,
        height: parseInt(options.height, 10) || 720,
        browser: options.browser,
        timeout: parseInt(options.timeout, 10) || 30000,
        fullPage: Boolean(options.fullPage)
      };

      console.log(chalk.gray(`Settings: ${screenshotOptions.width}x${screenshotOptions.height}, Full page: ${screenshotOptions.fullPage}`));

      const sessionDir = await PlaywrightScreenshot.takeScreenshot(url, screenshotOptions);
      console.log(chalk.green(`✅ Screenshots saved to: ${sessionDir}`));

      if (options.server) {
        console.log(chalk.blue('🚀 Starting web server...'));
        
        // Dynamic import of server module
        let remoteServer;
        try {
          remoteServer = require('../server');
        } catch (serverError) {
          console.error(chalk.red('❌ Error loading server module:'), serverError.message);
          
          // Try alternative server path
          try {
            remoteServer = require('../server/index');
          } catch (serverError2) {
            console.error(chalk.red('❌ Error loading server/index module:'), serverError2.message);
            console.log(chalk.yellow('⚠️  Server functionality not available'));
            return;
          }
        }
        
        const serverOptions = validateServerOptions({
          port: options.port ? parseInt(options.port, 10) : undefined,
          host: options.host || '0.0.0.0'
        });
        
        // Check and configure firewall
        const port = serverOptions.port || 9000;
        try {
          const firewallResult = await firewallManager.ensurePortAccess(port);
          if (firewallResult.ruleAdded) {
            console.log(chalk.yellow(`🔥 Added firewall rule: ${firewallResult.message}`));
          } else if (!firewallResult.success) {
            console.log(chalk.red(`⚠️  Firewall warning: ${firewallResult.message}`));
          }
        } catch (firewallError) {
          console.log(chalk.yellow(`⚠️  Firewall check failed: ${firewallError.message}`));
        }
        
        const serverInfo = await remoteServer.startServer({
          sessionDir,
          ...serverOptions
        });

        // Extract domain and timestamp from sessionDir for URL
        const pathParts = sessionDir.split(path.sep);
        const domain = pathParts[pathParts.length - 2];
        const timestamp = pathParts[pathParts.length - 1];
        
        console.log(chalk.green.bold('\n🌐 Web server successfully started!'));
        console.log(chalk.cyan.bold(`📋 Main page: ${serverInfo.baseUrl}`));
        console.log(chalk.yellow.bold(`📸 Direct link to your screenshots: ${serverInfo.baseUrl}/view/${domain}/${timestamp}`));
        console.log(chalk.gray(`🔧 Server running on port ${serverInfo.port}`));
        console.log(chalk.gray(`🌍 External IP: ${serverInfo.ip}`));
        
        // Keep server running
        console.log(chalk.blue('\n📌 Server is running. Press Ctrl+C to stop.'));
        
        // Handle graceful shutdown
        const shutdownHandler = () => {
          console.log(chalk.yellow('\n🛑 Stopping server...'));
          process.exit(0);
        };
        
        process.on('SIGINT', shutdownHandler);
        process.on('SIGTERM', shutdownHandler);
        
        // Keep process alive
        setInterval(() => {}, 1000);
      }
    } catch (error) {
      console.error(chalk.red('❌ CLI Error:'), error.message);
      if (error.stack) {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
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
      console.log(chalk.blue('🚀 Starting web server...'));
      
      // Dynamic import of server module with error handling
      let remoteServer;
      try {
        remoteServer = require('../server');
      } catch (serverError) {
        console.error(chalk.red('❌ Error loading server module:'), serverError.message);
        
        // Try alternative server path
        try {
          remoteServer = require('../server/index');
        } catch (serverError2) {
          console.error(chalk.red('❌ Error loading server/index module:'), serverError2.message);
          console.error(chalk.red('❌ Server functionality not available'));
          
          // List available files for debugging
          const fs = require('fs');
          console.log(chalk.gray('Available files in ../server/:'));
          try {
            const serverFiles = fs.readdirSync(path.join(__dirname, '../server'));
            serverFiles.forEach(file => console.log(chalk.gray(`  - ${file}`)));
          } catch (listError) {
            console.log(chalk.gray('Could not list server directory contents'));
          }
          
          process.exit(1);
        }
      }
      
      const serverOptions = validateServerOptions({
        port: options.port ? parseInt(options.port, 10) : undefined,
        host: options.host
      });
      
      // Check and configure firewall
      const port = serverOptions.port || 9000;
      try {
        const firewallResult = await firewallManager.ensurePortAccess(port);
        if (firewallResult.ruleAdded) {
          console.log(chalk.yellow(`🔥 Added firewall rule: ${firewallResult.message}`));
        } else if (!firewallResult.success) {
          console.log(chalk.red(`⚠️  Firewall warning: ${firewallResult.message}`));
        } else {
          console.log(chalk.green(`✅ Port ${port} is accessible`));
        }
      } catch (firewallError) {
        console.log(chalk.yellow(`⚠️  Firewall check failed: ${firewallError.message}`));
      }

      const serverInfo = await remoteServer.startServer(serverOptions);
      
      console.log(chalk.green.bold('🌐 Web server successfully started!'));
      console.log(chalk.cyan.bold(`📋 Main page: ${serverInfo.baseUrl}`));
      console.log(chalk.gray(`🔧 Server running on port ${serverInfo.port}`));
      console.log(chalk.gray(`🌍 External IP: ${serverInfo.ip}`));
      
      // Keep server running
      console.log(chalk.blue('\n📌 Server is running. Press Ctrl+C to stop.'));
      
      // Handle graceful shutdown
      const shutdownHandler = () => {
        console.log(chalk.yellow('\n🛑 Stopping server...'));
        process.exit(0);
      };
      
      process.on('SIGINT', shutdownHandler);
      process.on('SIGTERM', shutdownHandler);
      
      // Keep process alive
      setInterval(() => {}, 1000);
      
    } catch (error) {
      console.error(chalk.red('❌ Server Error:'), error.message);
      if (error.stack) {
        console.error(chalk.gray('Stack trace:'), error.stack);
      }
      console.log(chalk.yellow('\n🔍 Debugging information:'));
      console.log(chalk.gray(`Current working directory: ${process.cwd()}`));
      console.log(chalk.gray(`Node.js version: ${process.version}`));
      console.log(chalk.gray(`Platform: ${process.platform}`));
      process.exit(1);
    }
  });

// Debug command
program
  .command('debug')
  .description('Show debugging information')
  .action(() => {
    console.log(chalk.blue('🔍 PScreen Debug Information'));
    console.log(chalk.gray('================================'));
    console.log(chalk.gray(`Version: 1.0.3`));
    console.log(chalk.gray(`Node.js: ${process.version}`));
    console.log(chalk.gray(`Platform: ${process.platform}`));
    console.log(chalk.gray(`Working directory: ${process.cwd()}`));
    console.log(chalk.gray(`Script location: ${__filename}`));
    
    // Check critical files
    const fs = require('fs');
    const criticalFiles = [
      '../server/index.js',
      '../server.js',
      '../config/default.js',
      './screenshotService.js'
    ];
    
    console.log(chalk.gray('\nFile checks:'));
    criticalFiles.forEach(file => {
      const fullPath = path.join(__dirname, file);
      const exists = fs.existsSync(fullPath);
      console.log(chalk.gray(`  ${file}: ${exists ? '✅' : '❌'}`));
    });
    
    // Check results directory
    const resultsDir = '/var/lib/pscreen/results';
    const resultsDirExists = fs.existsSync(resultsDir);
    console.log(chalk.gray(`\nResults directory (${resultsDir}): ${resultsDirExists ? '✅' : '❌'}`));
    
    if (resultsDirExists) {
      try {
        const contents = fs.readdirSync(resultsDir);
        console.log(chalk.gray(`  Contains ${contents.length} items`));
      } catch (error) {
        console.log(chalk.gray(`  Error reading directory: ${error.message}`));
      }
    }
  });

// Parse command line arguments
program.parse();
