/**
 * Unit tests for validation utilities
 */

const { validateUrl, validateScreenshotOptions, extractDomain } = require('../../src/utils/validation');

describe('Validation Utils', () => {
  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe('https://example.com');
      expect(validateUrl('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('should reject invalid URLs', () => {
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL');
      expect(() => validateUrl('')).toThrow('Invalid URL');
    });
  });

  describe('extractDomain', () => {
    it('should extract domain from URL', () => {
      expect(extractDomain('https://example.com/path')).toBe('example.com');
      expect(extractDomain('http://subdomain.example.com')).toBe('subdomain.example.com');
    });

    it('should handle localhost URLs', () => {
      expect(extractDomain('http://localhost:3000')).toBe('localhost');
    });
  });

  describe('validateScreenshotOptions', () => {
    it('should validate correct screenshot options', () => {
      const options = {
        url: 'https://example.com',
        width: 1280,
        height: 720,
        browser: 'chromium'
      };

      const result = validateScreenshotOptions(options);
      expect(result.url).toBe(options.url);
      expect(result.width).toBe(options.width);
      expect(result.height).toBe(options.height);
      expect(result.browser).toBe(options.browser);
    });

    it('should apply default values', () => {
      const options = { url: 'https://example.com' };
      const result = validateScreenshotOptions(options);
      
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(result.browser).toBe('chromium');
    });
  });
});
