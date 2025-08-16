"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.revokeSession = revokeSession;
exports.revokeSessionByUserId = revokeSessionByUserId;
exports.rotateSession = rotateSession;
exports.revokeSessionById = revokeSessionById;
exports.cleanupExpiredSessions = cleanupExpiredSessions;
// Session service: handles session creation, revocation, refresh, and cleanup
const prisma_1 = require("../prisma");
const crypto_1 = require("crypto");
async function createSession(userId) {
    const token = (0, crypto_1.randomBytes)(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return prisma_1.prisma.session.create({
        data: { userId, token, expiry, updatedAt: new Date() }
    });
}
async function revokeSession(token) {
    await prisma_1.prisma.session.deleteMany({ where: { token } });
}
async function revokeSessionByUserId(userId) {
    await prisma_1.prisma.session.deleteMany({ where: { userId } });
}
async function rotateSession(sessionId) {
    const session = await prisma_1.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session)
        throw new Error('Session not found');
    const newToken = (0, crypto_1.randomBytes)(32).toString('hex');
    const newExpiry = new Date(Date.now() + 60 * 60 * 1000);
    return prisma_1.prisma.session.update({
        where: { id: sessionId },
        data: { token: newToken, expiry: newExpiry, updatedAt: new Date() }
    });
}
async function revokeSessionById(sessionId) {
    await prisma_1.prisma.session.deleteMany({ where: { id: sessionId } });
}
async function cleanupExpiredSessions() {
    const now = new Date();
    const { count } = await prisma_1.prisma.session.deleteMany({ where: { expiry: { lt: now } } });
    return count;
}
