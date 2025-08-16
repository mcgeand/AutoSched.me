"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = cleanupHandler;
const sessionService_1 = require("../../lib/auth/sessionService");
async function cleanupHandler(req, res) {
    try {
        const cleaned = await (0, sessionService_1.cleanupExpiredSessions)();
        return res.status(200).json({ cleaned });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(500).json({ error: 'Internal server error', details: message });
    }
}
