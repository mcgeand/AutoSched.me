// POST /api/auth/logout
// Handles session revocation and cookie clearing
import { Request, Response } from 'express';
import { revokeSessionById } from '../../lib/auth/sessionService';
import { getTokenFromRequest, clearSessionCookie, verifyJwt } from '../../lib/auth/jwt';

export default async function logoutHandler(req: Request, res: Response) {
  try {
    const token = getTokenFromRequest(req);
    const payload = verifyJwt(token);
    const sessionId = typeof payload === 'object' && payload !== null && 'sessionId' in payload
      ? (payload as any).sessionId
      : undefined;
    if (sessionId) await revokeSessionById(sessionId);
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
