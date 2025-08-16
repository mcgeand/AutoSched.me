"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sessionHandler;
const jwt_1 = require("../../lib/auth/jwt");
const prisma_1 = require("../../lib/prisma");
async function sessionHandler(req, res) {
    try {
        const token = req.cookies.session || req.headers.authorization?.split(' ')[1];
        const payload = (0, jwt_1.verifyJwt)(token);
        const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
            ? payload.sessionId
            : undefined;
        if (!sessionId)
            return res.status(401).json({ error: 'Invalid session' });
        const session = await prisma_1.prisma.session.findUnique({ where: { id: sessionId } });
        if (!session || new Date(session.expiry) < new Date()) {
            return res.status(401).json({ error: 'Session expired' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: session.userId } });
        return res.status(200).json({ user, expiry: session.expiry });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Internal server error', details: message });
    }
}
