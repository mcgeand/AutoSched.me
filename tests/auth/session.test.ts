// Integration tests for session management
// Uses Jest + Supertest
import request from 'supertest';
import { prisma } from '../../lib/prisma';
import app from '../../api/app';

const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

describe('Session Management', () => {
  beforeAll(async () => {
    // Clean up any existing test user and session
    await prisma.session.deleteMany({ where: { user: { email: TEST_USER_EMAIL } } });
    await prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });
    // Create test user
    await prisma.user.create({ data: { email: TEST_USER_EMAIL, name: 'Test User' } });
  });

  afterAll(async () => {
    // Clean up test user and session
    await prisma.session.deleteMany({ where: { user: { email: TEST_USER_EMAIL } } });
    await prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });
    await prisma.$disconnect();
  });

  it('should create a session on login (local)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiry).toBeDefined();
    expect(res.body.user.email).toBe(TEST_USER_EMAIL);
  });

  it('should enforce only one session per user', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
    expect(res2.status).toBe(200);
    // Check that only one session exists in DB
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    const sessions = await prisma.session.findMany({ where: { userId: user?.id } });
    expect(sessions.length).toBe(1);
  });

  it('should refresh a session token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.token });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.expiry).toBeDefined();
  });

  it('should revoke a session on logout', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [`session=${login.body.token}`]);
    expect(res.status).toBe(200);
    // Check that session is deleted
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    const session = await prisma.session.findFirst({ where: { userId: user?.id } });
    expect(session).toBeNull();
  });

  it('should cleanup expired sessions', async () => {
    // Clean up any existing session for the test user
    const user = await prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
    await prisma.session.deleteMany({ where: { userId: user?.id } });
    // Manually create an expired session for a new temp user
    const tempUser = await prisma.user.create({ data: { email: 'tempuser@example.com', name: 'Temp User' } });
    await prisma.session.create({
      data: {
        userId: tempUser.id,
        token: 'expiredtoken',
        expiry: new Date(Date.now() - 1000 * 60),
      },
    });
    const res = await request(app)
      .post('/api/auth/cleanup');
    expect(res.status).toBe(200);
    expect(res.body.cleaned).toBeGreaterThanOrEqual(1);
    // Clean up temp user
    await prisma.user.delete({ where: { id: tempUser.id } });
  });
});
