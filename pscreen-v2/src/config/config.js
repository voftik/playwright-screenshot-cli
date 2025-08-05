const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Configuration manager for PScreen v2.0.0
 */
class ConfigManager {
  constructor() {
    this.configPaths = [
      path.join(process.cwd(), '.pscreen.json'),
      path.join(os.homedir(), '.pscreen.json'),
      '/etc/pscreen/config.json'
    ];
    
    this.defaultConfig = {
      // Screenshot settings
      screenshot: {
        outputDir: process.env.PSCREEN_OUTPUT_DIR || path.join(process.cwd(), 'screenshots'),
        width: parseInt(process.env.PSCREEN_WIDTH) || 1920,
        height: parseInt(process.env.PSCREEN_HEIGHT) || 1080,
        fullPage: process.env.PSCREEN_FULL_PAGE === 'true' || true,
        browser: process.env.PSCREEN_BROWSER || 'chromium',
        timeout: parseInt(process.env.PSCREEN_TIMEOUT) || 30000,
        format: process.env.PSCREEN_FORMAT || 'png',
        quality: parseInt(process.env.PSCREEN_QUALITY) || 90
      },
      
      // Server settings
      server: {
        enabled: process.env.PSCREEN_SERVER_ENABLED !== 'false',
        port: parseInt(process.env.PSCREEN_PORT) || 9000,
        host: process.env.PSCREEN_HOST || '0.0.0.0',
        autoStart: process.env.PSCREEN_AUTO_START !== 'false',
        staticPath: '/static',
        maxRequestSize: '50mb'
      },
      
      // Logging settings
      logging: {
        level: process.env.PSCREEN_LOG_LEVEL || 'info',
        file: process.env.PSCREEN_LOG_FILE || '/var/log/pscreen.log',
        console: process.env.PSCREEN_LOG_CONSOLE !== 'false',
        json: process.env.PSCREEN_LOG_JSON === 'true',
        verbose: false,
        quiet: false
      },
      
      // CLI settings
      cli: {
        interactive: true,
        confirmations: true,
        colors: true,
        progress: true
      },
      
      // Automation settings
      automation: {
        retries: parseInt(process.env.PSCREEN_RETRIES) || 3,
        timeout: parseInt(process.env.PSCREEN_AUTOMATION_TIMEOUT) || 60000,
        parallelLimit: parseInt(process.env.PSCREEN_PARALLEL) || 1,
        continueOnError: process.env.PSCREEN_CONTINUE_ON_ERROR === 'true'
      },
      
      // Security settings
      security: {
        cors: {
          enabled: true,
          origin: process.env.PSCREEN_CORS_ORIGIN || '*'
        },
        rateLimit: {
          enabled: false,
          windowMs: 15 * 60 * 1000,
          max: 100
        }
      }
    };
    
    this.config = this.loadConfig();
  }
  
  loadConfig() {
    let config = { ...this.defaultConfig };
    
    // Try to load from config files
    for (const configPath of this.configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          config = this.mergeConfig(config, fileConfig);
          break;
        } catch (error) {
          console.warn(`Warning: Could not parse config file ${configPath}: ${error.message}`);
        }
      }
    }
    
    return config;
  }
  
  mergeConfig(base, override) {
    const result = { ...base };
    
    for (const key in override) {
      if (override[key] && typeof override[key] === 'object' && !Array.isArray(override[key])) {
        result[key] = this.mergeConfig(base[key] || {}, override[key]);
      } else {
        result[key] = override[key];
      }
    }
    
    return result;
  }
  
  get(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }
  
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);
    
    target[lastKey] = value;
  }
  
  save(configPath = this.configPaths[0]) {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error(`Error saving config to ${configPath}: ${error.message}`);
      return false;
    }
  }
  
  createSampleConfig(configPath) {
    const sampleConfig = {
      screenshot: {
        outputDir: "./screenshots",
        width: 1920,
        height: 1080,
        fullPage: true,
        browser: "chromium",
        timeout: 30000
      },
      server: {
        enabled: true,
        port: 9000,
        host: "0.0.0.0",
        autoStart: true
      },
      logging: {
        level: "info",
        console: true,
        file: "/var/log/pscreen.log"
      }
    };
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(sampleConfig, null, 2));
      return true;
    } catch (error) {
      console.error(`Error creating sample config: ${error.message}`);
      return false;
    }
  }
}

module.exports = ConfigManager;
