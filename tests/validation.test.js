/**
 * Unit tests for validation functions
 * @file tests/validation.test.js
 */

const assert = require('assert');
const { validateScreenshotOptions } = require('../index.js');

describe('Validation Functions', function() {
  describe('validateScreenshotOptions', function() {
    it('should validate correct options', function() {
      const validOptions = {
        width: 1920,
        height: 1080,
        timeout: 30000,
        fullPage: true,
        quality: 90
      };

      const result = validateScreenshotOptions(validOptions);
      assert.deepStrictEqual(result, validOptions);
    });

    it('should reject invalid width', function() {
      const options = { width: 50 }; // Below minimum
      
      assert.throws(
        () => validateScreenshotOptions(options),
        /Invalid screenshot options/
      );
    });

    it('should reject invalid height', function() {
      const options = { height: 6000 }; // Above maximum
      
      assert.throws(
        () => validateScreenshotOptions(options),
        /Invalid screenshot options/
      );
    });

    it('should reject invalid timeout', function() {
      const options = { timeout: 500 }; // Below minimum
      
      assert.throws(
        () => validateScreenshotOptions(options),
        /Invalid screenshot options/
      );
    });

    it('should reject invalid quality', function() {
      const options = { quality: 120 }; // Above maximum
      
      assert.throws(
        () => validateScreenshotOptions(options),
        /Invalid screenshot options/
      );
    });

    it('should allow empty options object', function() {
      const options = {};
      const result = validateScreenshotOptions(options);
      assert.deepStrictEqual(result, {});
    });
  });
});
