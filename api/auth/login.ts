// POST /api/auth/login
// Handles user login (local or OAuth), session creation, and JWT/cookie issuance
import { Request, Response } from 'express';
import { createSession, revokeSessionByUserId } from '../../lib/auth/sessionService';
import { signJwt, setSessionCookie } from '../../lib/auth/jwt';
import { verifyGoogleToken, verifyMicrosoftToken } from '../../lib/auth/oauthService';
import { prisma } from '../../lib/prisma';

export default async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password, provider, oauthToken } = req.body;
    let user;

    if (provider && oauthToken) {
      // OAuth login
      if (provider === 'google') {
        user = await verifyGoogleToken(oauthToken);
      } else if (provider === 'microsoft') {
        user = await verifyMicrosoftToken(oauthToken);
      } else {
        return res.status(400).json({ error: 'Unsupported provider' });
      }
      // Find or create user in DB
      user = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: { email: user.email, name: user.name },
      });
    } else if (email && password) {
      // Local login (pseudo-code, replace with real password check)
      user = await prisma.user.findUnique({ where: { email } });
      if (!user || password !== 'password123') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Revoke any existing session
    await revokeSessionByUserId(user.id);
    // Create new session
    const session = await createSession(user.id);
    // Sign JWT
    const token = signJwt({ userId: user.id, sessionId: session.id }, session.expiry);
    // Set cookie
    setSessionCookie(res, token, session.expiry);
    // Respond
    return res.status(200).json({ token, expiry: session.expiry, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
