// POST /api/auth/cleanup
// Deletes expired sessions (admin/cron only)
import { Request, Response } from 'express';
import { cleanupExpiredSessions } from '../../lib/auth/sessionService';

export default async function cleanupHandler(req: Request, res: Response) {
  try {
    const cleaned = await cleanupExpiredSessions();
    return res.status(200).json({ cleaned });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: 'Internal server error', details: message });
  }
}
