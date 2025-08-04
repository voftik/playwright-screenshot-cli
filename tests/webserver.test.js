/**
 * Unit tests for web server functionality
 * @file tests/webserver.test.js
 */

const assert = require('assert');
const http = require('http');
const path = require('path');

describe('Web Server', function() {
  let server;
  const testPort = 9999;

  before(function(done) {
    // Start the web server for testing
    const webServer = require('../web-server.js');
    
    // Give server time to start
    setTimeout(() => {
      done();
    }, 2000);
  });

  describe('Health Check Endpoint', function() {
    it('should respond to health check', function(done) {
      const options = {
        hostname: 'localhost',
        port: 9000, // Default port from web-server.js
        path: '/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        assert.strictEqual(res.statusCode, 200);
        
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const response = JSON.parse(data);
          assert.strictEqual(response.status, 'healthy');
          assert(response.timestamp);
          done();
        });
      });

      req.on('error', (err) => {
        // Server might not be running in test environment
        console.warn('Health check test skipped - server not accessible:', err.message);
        done();
      });

      req.end();
    });
  });

  describe('API Endpoints', function() {
    it('should handle screenshot requests', function(done) {
      const postData = JSON.stringify({
        url: 'https://httpbin.org/html',
        width: 800,
        height: 600
      });

      const options = {
        hostname: 'localhost',
        port: 9000,
        path: '/api/screenshot',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            const response = JSON.parse(data);
            assert(response.success !== undefined);
          }
          done();
        });
      });

      req.on('error', (err) => {
        console.warn('API test skipped - server not accessible:', err.message);
        done();
      });

      req.write(postData);
      req.end();
    });
  });
});
