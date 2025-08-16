// Session service: handles session creation, revocation, refresh, and cleanup
import { prisma } from '../prisma';
import { randomBytes } from 'crypto';

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return prisma.session.create({
    data: { userId, token, expiry }
  });
}

export async function revokeSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}

export async function revokeSessionByUserId(userId: number) {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function rotateSession(sessionId: number) {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');
  const newToken = randomBytes(32).toString('hex');
  const newExpiry = new Date(Date.now() + 60 * 60 * 1000);
  return prisma.session.update({
    where: { id: sessionId },
    data: { token: newToken, expiry: newExpiry }
  });
}

export async function revokeSessionById(sessionId: number) {
  await prisma.session.deleteMany({ where: { id: sessionId } });
}

export async function cleanupExpiredSessions() {
  const now = new Date();
  const { count } = await prisma.session.deleteMany({ where: { expiry: { lt: now } } });
  return count;
}
