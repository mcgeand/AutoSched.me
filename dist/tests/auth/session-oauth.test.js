"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Integration tests for OAuth login flows (Google, Microsoft)
// Uses Jest + Supertest
const supertest_1 = __importDefault(require("supertest"));
const prisma_1 = require("../../lib/prisma");
// You need to provide your app entry point here
const app_1 = __importDefault(require("../../api/app")); // <-- Update this import to your actual app entry point
jest.mock('../../lib/auth/oauthService', () => ({
    verifyGoogleToken: jest.fn().mockResolvedValue({ email: 'googleuser@example.com', name: 'Google User' }),
    verifyMicrosoftToken: jest.fn().mockResolvedValue({ email: 'msuser@example.com', name: 'MS User' })
}));
describe('OAuth Session Management', () => {
    afterAll(async () => {
        await prisma_1.prisma.$disconnect();
    });
    it('should create a session on Google OAuth login', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ provider: 'google', oauthToken: 'valid-google-token' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('googleuser@example.com');
    });
    it('should create a session on Microsoft OAuth login', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ provider: 'microsoft', oauthToken: 'valid-ms-token' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('msuser@example.com');
    });
    it('should reject login with unsupported provider', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ provider: 'facebook', oauthToken: 'token' });
        expect(res.status).toBe(400);
    });
    it('should reject login with missing oauthToken', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/auth/login')
            .send({ provider: 'google' });
        expect(res.status).toBe(400);
    });
});
