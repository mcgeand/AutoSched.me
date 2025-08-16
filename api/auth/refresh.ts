// POST /api/auth/refresh
// Handles session refresh and token rotation
import { Request, Response } from 'express';
import { rotateSession } from '../../lib/auth/sessionService';
import { signJwt, setSessionCookie, verifyJwt } from '../../lib/auth/jwt';

export default async function refreshHandler(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    const payload = verifyJwt(refreshToken);
    const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
      ? (payload as any).sessionId
      : undefined;
    if (!sessionId) return res.status(401).json({ error: 'Invalid token' });
    const session = await rotateSession(sessionId);
    const token = signJwt({ userId: session.userId, sessionId: session.id }, session.expiry);
    setSessionCookie(res, token, session.expiry);
    return res.status(200).json({ token, expiry: session.expiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
