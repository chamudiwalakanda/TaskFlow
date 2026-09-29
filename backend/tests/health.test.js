const request = require('supertest');
const app = require('../src/app');

describe('TaskFlow API', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects protected routes without a token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.statusCode).toBe(401);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.statusCode).toBe(404);
  });
});
