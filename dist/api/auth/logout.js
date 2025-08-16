"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = logoutHandler;
const sessionService_1 = require("../../lib/auth/sessionService");
const jwt_1 = require("../../lib/auth/jwt");
async function logoutHandler(req, res) {
    try {
        const token = (0, jwt_1.getTokenFromRequest)(req);
        const payload = (0, jwt_1.verifyJwt)(token);
        const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
            ? payload.sessionId
            : undefined;
        if (sessionId)
            await (0, sessionService_1.revokeSessionById)(sessionId);
        (0, jwt_1.clearSessionCookie)(res);
        return res.status(200).json({ success: true });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Internal server error', details: message });
    }
}
