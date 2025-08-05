const { z } = require('zod');
const config = require('../../config/default.js');

/**
 * Validation schemas using Zod
 */

// Screenshot options validation
const validateScreenshotOptions = (options) => {
  const schema = z.object({
    url: z.string().url('Invalid URL format'),
    width: z.number().min(1).max(4000).default(config.screenshot.defaultWidth),
    height: z.number().min(1).max(3000).default(config.screenshot.defaultHeight),
    browser: z.enum(config.screenshot.supportedBrowsers).default(config.screenshot.defaultBrowser),
    timeout: z.number().min(1000).max(300000).default(config.screenshot.defaultTimeout),
    fullPage: z.boolean().default(config.screenshot.fullPage),
    outputDir: z.string().optional().default(config.screenshot.outputDir)
  });
  
  return schema.parse(options);
};

// Server options validation
const validateServerOptions = (options) => {
  const schema = z.object({
    port: z.number().min(1).max(65535).optional(),
    host: z.string().default(config.server.host)
  });
  
  return schema.parse(options);
};

// Extract domain from URL
const extractDomain = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
};

// Validate cleanup options
const validateCleanupOptions = (options) => {
  const schema = z.object({
    all: z.boolean().default(false),
    days: z.number().min(1).max(365).optional()
  });
  
  return schema.parse(options);
};

module.exports = {
  validateScreenshotOptions,
  validateServerOptions,
  extractDomain,
  validateCleanupOptions
};
