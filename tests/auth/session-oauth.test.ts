// Integration tests for OAuth login flows (Google, Microsoft)
// Uses Jest + Supertest
import request from 'supertest';
import { prisma } from '../../lib/prisma';

// You need to provide your app entry point here
import app from '../../api/app'; // <-- Update this import to your actual app entry point

jest.mock('../../lib/auth/oauthService', () => ({
  verifyGoogleToken: jest.fn().mockResolvedValue({ email: 'googleuser@example.com', name: 'Google User' }),
  verifyMicrosoftToken: jest.fn().mockResolvedValue({ email: 'msuser@example.com', name: 'MS User' })
}));

describe.skip('OAuth Session Management', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create a session on Google OAuth login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ provider: 'google', oauthToken: 'valid-google-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('googleuser@example.com');
  });

  it('should create a session on Microsoft OAuth login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ provider: 'microsoft', oauthToken: 'valid-ms-token' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('msuser@example.com');
  });

  it('should reject login with unsupported provider', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ provider: 'facebook', oauthToken: 'token' });
    expect(res.status).toBe(400);
  });

  it('should reject login with missing oauthToken', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ provider: 'google' });
    expect(res.status).toBe(400);
  });
});
