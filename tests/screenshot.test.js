/**
 * Unit tests for screenshot functionality
 * @file tests/screenshot.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { takeScreenshot } = require('../index.js');

/**
 * Test helper function to clean up test files
 * @param {string} filePath - Path to file to remove
 */
function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Could not clean up file ${filePath}:`, error.message);
  }
}

describe('Screenshot Functionality', function() {
  this.timeout(30000); // Increase timeout for browser operations

  beforeEach(function() {
    // Ensure results directory exists
    const resultsDir = path.join(__dirname, '..', 'results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
  });

  describe('takeScreenshot', function() {
    it('should successfully take a screenshot of a valid URL', async function() {
      const testUrl = 'https://httpbin.org/html';
      const result = await takeScreenshot(testUrl, {
        width: 1200,
        height: 800,
        timeout: 15000
      });

      assert.strictEqual(result.success, true);
      assert(result.path, 'Screenshot path should be provided');
      assert(result.fileSize > 0, 'File size should be greater than 0');
      assert(result.duration > 0, 'Duration should be greater than 0');
      
      // Check that file actually exists
      assert(fs.existsSync(result.path), 'Screenshot file should exist');
      
      // Cleanup
      cleanupFile(result.path);
    });

    it('should fail for invalid URL', async function() {
      const invalidUrl = 'not-a-valid-url';
      const result = await takeScreenshot(invalidUrl);

      assert.strictEqual(result.success, false);
      assert(result.error, 'Error message should be provided');
      assert.strictEqual(result.fileSize, 0);
    });

    it('should fail for unreachable URL', async function() {
      const unreachableUrl = 'https://this-domain-should-not-exist-12345.com';
      const result = await takeScreenshot(unreachableUrl, {
        timeout: 5000
      });

      assert.strictEqual(result.success, false);
      assert(result.error, 'Error message should be provided');
      assert.strictEqual(result.fileSize, 0);
    });

    it('should handle custom viewport dimensions', async function() {
      const testUrl = 'https://httpbin.org/html';
      const result = await takeScreenshot(testUrl, {
        width: 800,
        height: 600,
        timeout: 15000
      });

      assert.strictEqual(result.success, true);
      assert(result.fileSize > 0, 'File size should be greater than 0');
      
      // Cleanup
      cleanupFile(result.path);
    });

    it('should validate screenshot options', async function() {
      const testUrl = 'https://httpbin.org/html';
      
      try {
        await takeScreenshot(testUrl, {
          width: 50, // Below minimum
          height: 600,
          timeout: 15000
        });
        assert.fail('Should have thrown validation error');
      } catch (error) {
        assert(error.message.includes('Invalid screenshot options'));
      }
    });

    it('should normalize URLs correctly', async function() {
      const testUrl = 'httpbin.org/html'; // Without protocol
      const result = await takeScreenshot(testUrl, {
        timeout: 15000
      });

      assert.strictEqual(result.success, true);
      
      // Cleanup
      cleanupFile(result.path);
    });
  });
});
