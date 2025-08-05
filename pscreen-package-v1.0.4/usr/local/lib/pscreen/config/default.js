const path = require('path');

module.exports = {
  screenshot: {
    outputDir: process.env.PSCREEN_RESULTS_DIR || '/var/lib/pscreen/results',
    defaultTimeout: 30000,
    defaultWidth: 1280,
    defaultHeight: 720,
    defaultBrowser: 'chromium',
    fullPage: true,
    supportedFormats: ['png', 'jpeg'],
    supportedBrowsers: ['chromium', 'firefox', 'webkit']
  },
  
  server: {
    defaultPort: 9000,
    portRange: [9000, 9010],
    host: '0.0.0.0',
    staticPath: '/static',
    maxRequestSize: '50mb'
  },
  
  security: {
    cors: {
      enabled: true,
      origin: '*',
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    csp: {
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    rateLimit: {
      enabled: false,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    }
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: '/var/log/pscreen.log',
    console: true,
    format: 'combined',
    dateFormat: 'YYYY-MM-DD HH:mm:ss'
  },
  
  cleanup: {
    defaultRetentionDays: 30,
    maxStorageSize: '1GB',
    autoCleanup: false
  },
  
  external: {
    ipServices: [
      'https://api.ipify.org?format=json',
      'https://ipinfo.io/json',
      'https://api.ip.sb/jsonip'
    ],
    cacheTtl: 300000, // 5 minutes
    timeout: 5000
  }
};
