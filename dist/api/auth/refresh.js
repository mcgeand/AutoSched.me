"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = refreshHandler;
const sessionService_1 = require("../../lib/auth/sessionService");
const jwt_1 = require("../../lib/auth/jwt");
async function refreshHandler(req, res) {
    try {
        const { refreshToken } = req.body;
        const payload = (0, jwt_1.verifyJwt)(refreshToken);
        const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
            ? payload.sessionId
            : undefined;
        if (!sessionId)
            return res.status(401).json({ error: 'Invalid token' });
        const session = await (0, sessionService_1.rotateSession)(sessionId);
        const token = (0, jwt_1.signJwt)({ userId: session.userId, sessionId: session.id }, session.expiry);
        (0, jwt_1.setSessionCookie)(res, token, session.expiry);
        return res.status(200).json({ token, expiry: session.expiry });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Internal server error', details: message });
    }
}
