/**
 * Integration tests for the web server
 */

const request = require('supertest');
const server = require('../../src/server');

describe('Web Server Integration', () => {
  let app;

  beforeAll(async () => {
    app = server.app;
  });

  describe('GET /', () => {
    it('should return the main page', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Playwright Screenshot Gallery');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /view/:domain/:timestamp', () => {
    it('should return 404 for non-existent session', async () => {
      const response = await request(app).get('/view/example.com/2025-01-01T00:00:00.000Z');
      expect(response.status).toBe(404);
    });
  });
});
