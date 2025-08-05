/**
 * Input validation utilities
 * @module utils/validation
 */

const { z } = require('zod');
const config = require('../../config/default');

// URL validation schema
const urlSchema = z.string().url('Invalid URL format');

// Screenshot options schema
const screenshotOptionsSchema = z.object({
  url: urlSchema,
  outputDir: z.string().default(config.screenshot.outputDir),
  width: z.number().min(1).max(4000).default(config.screenshot.viewport.width),
  height: z.number().min(1).max(4000).default(config.screenshot.viewport.height),
  browser: z.enum(config.screenshot.browsers).default(config.screenshot.defaultBrowser),
  timeout: z.number().min(1000).max(120000).default(config.screenshot.timeout),
  fullPage: z.boolean().default(true)
});

// Server options schema
const serverOptionsSchema = z.object({
  port: z.number().min(1).max(65535).optional(),
  host: z.string().default(config.server.host)
});

/**
 * Validate screenshot options
 * @param {Object} options - Options to validate
 * @returns {Object} Validated options
 * @throws {Error} If validation fails
 */
function validateScreenshotOptions(options) {
  try {
    return screenshotOptionsSchema.parse(options);
  } catch (error) {
    throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

/**
 * Validate server options
 * @param {Object} options - Options to validate
 * @returns {Object} Validated options
 * @throws {Error} If validation fails
 */
function validateServerOptions(options) {
  try {
    return serverOptionsSchema.parse(options);
  } catch (error) {
    throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
  }
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {string} Validated URL
 * @throws {Error} If validation fails
 */
function validateUrl(url) {
  try {
    return urlSchema.parse(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${error.errors[0].message}`);
  }
}

/**
 * Extract domain from URL
 * @param {string} url - URL to parse
 * @returns {string} Domain name
 */
function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    throw new Error(`Invalid URL format: ${error.message}`);
  }
}

module.exports = {
  validateScreenshotOptions,
  validateServerOptions,
  validateUrl,
  extractDomain,
  schemas: {
    urlSchema,
    screenshotOptionsSchema,
    serverOptionsSchema
  }
};
