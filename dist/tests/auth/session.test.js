"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Integration tests for session management
// Uses Jest + Supertest
const supertest_1 = __importDefault(require("supertest"));
const prisma_1 = require("../../lib/prisma");
const app_1 = __importDefault(require("../../api/app"));
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';
describe('Session Management', () => {
    beforeAll(async () => {
        // Clean up any existing test user and session
        await prisma_1.prisma.session.deleteMany({ where: { User: { email: TEST_USER_EMAIL } } });
        await prisma_1.prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });
        // Create test user
        await prisma_1.prisma.user.create({ data: { email: TEST_USER_EMAIL, name: 'Test User' } });
    });
    afterAll(async () => {
        // Clean up test user and session
        await prisma_1.prisma.session.deleteMany({ where: { User: { email: TEST_USER_EMAIL } } });
        await prisma_1.prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });
        await prisma_1.prisma.$disconnect();
    });
    it('should create a session on login (local)', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.expiry).toBeDefined();
        expect(res.body.user.email).toBe(TEST_USER_EMAIL);
    });
    it('should enforce only one session per user', async () => {
        await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
        const res2 = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
        expect(res2.status).toBe(200);
        // Check that only one session exists in DB
        const user = await prisma_1.prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
        const sessions = await prisma_1.prisma.session.findMany({ where: { userId: user?.id } });
        expect(sessions.length).toBe(1);
    });
    it('should refresh a session token', async () => {
        const login = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/refresh')
            .send({ refreshToken: login.body.token });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.expiry).toBeDefined();
    });
    it('should revoke a session on logout', async () => {
        const login = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/logout')
            .set('Cookie', [`session=${login.body.token}`]);
        expect(res.status).toBe(200);
        // Check that session is deleted
        const user = await prisma_1.prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
        const session = await prisma_1.prisma.session.findFirst({ where: { userId: user?.id } });
        expect(session).toBeNull();
    });
    it('should cleanup expired sessions', async () => {
        // Clean up any existing session for the test user
        const user = await prisma_1.prisma.user.findUnique({ where: { email: TEST_USER_EMAIL } });
        await prisma_1.prisma.session.deleteMany({ where: { userId: user?.id } });
        // Manually create an expired session for a new temp user
        const tempUser = await prisma_1.prisma.user.create({ data: { email: 'tempuser@example.com', name: 'Temp User' } });
        await prisma_1.prisma.session.create({
            data: {
                userId: tempUser.id,
                token: 'expiredtoken',
                expiry: new Date(Date.now() - 1000 * 60),
                updatedAt: new Date(),
            },
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/cleanup');
        expect(res.status).toBe(200);
        expect(res.body.cleaned).toBeGreaterThanOrEqual(1);
        // Clean up temp user
        await prisma_1.prisma.user.delete({ where: { id: tempUser.id } });
    });
});
