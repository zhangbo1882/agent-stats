import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test.describe('GET /api/data', () => {
    test('should return valid JSON response', async ({ request }) => {
      const response = await request.get('/api/data');

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should contain stats data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('stats');
      expect(data.stats).toBeDefined();
    });

    test('should contain required stats fields', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      // Check basic fields of stats data
      expect(data.stats).toHaveProperty('totalSessions');
      expect(data.stats).toHaveProperty('totalMessages');
      expect(data.stats).toHaveProperty('dailyActivity');
      expect(data.stats).toHaveProperty('version');

      // Verify data types
      expect(typeof data.stats.totalSessions).toBe('number');
      expect(typeof data.stats.totalMessages).toBe('number');
      expect(Array.isArray(data.stats.dailyActivity)).toBe(true);
    });

    test('should contain settings data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('settings');
      expect(data.settings).toBeDefined();
    });

    test('should contain history data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('history');
      expect(data.history).toBeDefined();
    });

    test('should contain plugins data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('plugins');
      expect(data.plugins).toBeDefined();
    });

    test('should contain mcp data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('mcp');
      expect(data.mcp).toBeDefined();
    });

    test('should contain plans data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('plans');
      expect(data.plans).toBeDefined();
    });

    test('should contain projects data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('projects');
      expect(data.projects).toBeDefined();
    });

    test('should contain debug data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('debug');
      expect(data.debug).toBeDefined();
    });

    test('should contain skills data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      expect(data).toHaveProperty('skills');
      expect(data.skills).toBeDefined();
    });

    test('should handle CORS correctly', async ({ request }) => {
      const response = await request.get('/api/data', {
        headers: {
          'Origin': 'http://localhost:3000',
        },
      });

      // Check CORS headers
      const corsHeader = response.headers()['access-control-allow-origin'];
      expect(corsHeader).toBeDefined();
    });

    test('should respond within reasonable time', async ({ request }) => {
      const startTime = Date.now();
      await request.get('/api/data');
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // API should respond within 5 seconds
      expect(responseTime).toBeLessThan(5000);
    });

    test('should contain valid daily activity data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      if (data.stats.dailyActivity && data.stats.dailyActivity.length > 0) {
        const firstDay = data.stats.dailyActivity[0];

        expect(firstDay).toHaveProperty('date');
        expect(firstDay).toHaveProperty('messageCount');
        expect(firstDay).toHaveProperty('sessionCount');

        expect(typeof firstDay.date).toBe('string');
        expect(typeof firstDay.messageCount).toBe('number');
        expect(typeof firstDay.sessionCount).toBe('number');
      }
    });

    test('should contain model usage data', async ({ request }) => {
      const response = await request.get('/api/data');
      const data = await response.json();

      if (data.stats.modelUsage) {
        expect(typeof data.stats.modelUsage).toBe('object');
      }
    });

    test('should handle HTTP methods correctly', async ({ request }) => {
      // Test unsupported methods
      const postResponse = await request.post('/api/data');
      expect(postResponse.status()).toBe(405); // Method Not Allowed

      const putResponse = await request.put('/api/data');
      expect(putResponse.status()).toBe(405);

      const deleteResponse = await request.delete('/api/data');
      expect(deleteResponse.status()).toBe(405);
    });
  });
});
