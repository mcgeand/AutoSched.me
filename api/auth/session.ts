// GET /api/auth/session
// Returns current session info if valid
import { Request, Response } from 'express';
import { verifyJwt } from '../../lib/auth/jwt';
import { prisma } from '../../lib/prisma';

export default async function sessionHandler(req: Request, res: Response) {
  try {
    const token = req.cookies.session || req.headers.authorization?.split(' ')[1];
    const payload = verifyJwt(token);
    const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
      ? (payload as any).sessionId
      : undefined;
    if (!sessionId) return res.status(401).json({ error: 'Invalid session' });
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || new Date(session.expiry) < new Date()) {
      return res.status(401).json({ error: 'Session expired' });
    }
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    return res.status(200).json({ user, expiry: session.expiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
