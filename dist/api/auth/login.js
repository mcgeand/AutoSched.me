"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = loginHandler;
const sessionService_1 = require("../../lib/auth/sessionService");
const jwt_1 = require("../../lib/auth/jwt");
const oauthService_1 = require("../../lib/auth/oauthService");
const prisma_1 = require("../../lib/prisma");
async function loginHandler(req, res) {
    try {
        const { email, password, provider, oauthToken } = req.body;
        let user;
        if (provider && oauthToken) {
            // OAuth login
            if (provider === 'google') {
                user = await (0, oauthService_1.verifyGoogleToken)(oauthToken);
            }
            else if (provider === 'microsoft') {
                user = await (0, oauthService_1.verifyMicrosoftToken)(oauthToken);
            }
            else {
                return res.status(400).json({ error: 'Unsupported provider' });
            }
            // Find or create user in DB
            user = await prisma_1.prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: { email: user.email, name: user.name },
            });
        }
        else if (email && password) {
            // Local login (pseudo-code, replace with real password check)
            user = await prisma_1.prisma.user.findUnique({ where: { email } });
            if (!user || password !== 'password123') {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }
        else {
            return res.status(400).json({ error: 'Missing credentials' });
        }
        // Revoke any existing session
        await (0, sessionService_1.revokeSessionByUserId)(user.id);
        // Create new session
        const session = await (0, sessionService_1.createSession)(user.id);
        // Sign JWT
        const token = (0, jwt_1.signJwt)({ userId: user.id, sessionId: session.id }, session.expiry);
        // Set cookie
        (0, jwt_1.setSessionCookie)(res, token, session.expiry);
        // Respond
        return res.status(200).json({ token, expiry: session.expiry, user });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Internal server error', details: message });
    }
}
