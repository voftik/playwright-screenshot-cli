/**
 * Application configuration
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 9000,
    host: process.env.HOST || '0.0.0.0',
    portRange: {
      start: 9000,
      end: 9010
    }
  },

  // Screenshot configuration  
  screenshot: {
    outputDir: process.env.RESULTS_DIR || 'results',
    timeout: 30000,
    viewport: {
      width: 1280,
      height: 720
    },
    browsers: ['chromium', 'firefox', 'webkit'],
    defaultBrowser: 'chromium'
  },

  // External IP service configuration
  externalIp: {
    services: [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://jsonip.com'
    ],
    cacheTimeout: 300000, // 5 minutes
    fallbackIp: '127.0.0.1'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  },

  // Security configuration
  security: {
    cors: {
      enabled: true,
      origin: '*'
    },
    csp: {
      enabled: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"]
      }
    }
  }
};
