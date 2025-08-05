const winston = require('winston');
const chalk = require('chalk');

/**
 * Enhanced logger for PScreen v2.0.0
 */
class Logger {
  constructor(config = {}) {
    this.config = {
      level: config.level || 'info',
      console: config.console !== false,
      file: config.file,
      json: config.json || false,
      verbose: config.verbose || false,
      quiet: config.quiet || false,
      colors: config.colors !== false
    };
    
    this.winston = winston.createLogger({
      level: this.config.level,
      format: this.config.json 
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        : winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              let output = `${timestamp} [${level.toUpperCase()}]: ${message}`;
              if (Object.keys(meta).length > 0) {
                output += ` ${JSON.stringify(meta)}`;
              }
              return output;
            })
          ),
      transports: []
    });
    
    // Console transport
    if (this.config.console && !this.config.quiet) {
      this.winston.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
    
    // File transport
    if (this.config.file) {
      this.winston.add(new winston.transports.File({
        filename: this.config.file,
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }));
    }
  }
  
  // Console output methods with colors
  success(message, data = {}) {
    if (!this.config.quiet) {
      console.log(this.config.colors ? chalk.green(`✅ ${message}`) : `✅ ${message}`);
    }
    this.winston.info(message, data);
  }
  
  error(message, data = {}) {
    if (!this.config.quiet) {
      console.error(this.config.colors ? chalk.red(`❌ ${message}`) : `❌ ${message}`);
    }
    this.winston.error(message, data);
  }
  
  warn(message, data = {}) {
    if (!this.config.quiet) {
      console.warn(this.config.colors ? chalk.yellow(`⚠️  ${message}`) : `⚠️  ${message}`);
    }
    this.winston.warn(message, data);
  }
  
  info(message, data = {}) {
    if (!this.config.quiet) {
      console.log(this.config.colors ? chalk.blue(`ℹ️  ${message}`) : `ℹ️  ${message}`);
    }
    this.winston.info(message, data);
  }
  
  debug(message, data = {}) {
    if (this.config.verbose && !this.config.quiet) {
      console.log(this.config.colors ? chalk.gray(`🔍 ${message}`) : `🔍 ${message}`);
    }
    this.winston.debug(message, data);
  }
  
  progress(message, data = {}) {
    if (!this.config.quiet) {
      console.log(this.config.colors ? chalk.cyan(`🔄 ${message}`) : `🔄 ${message}`);
    }
    this.winston.info(message, data);
  }
  
  // JSON output for automation
  jsonOutput(data) {
    console.log(JSON.stringify(data, null, this.config.json ? 2 : 0));
  }
  
  // Raw winston methods
  log(level, message, data = {}) {
    this.winston.log(level, message, data);
  }
}

module.exports = Logger;
