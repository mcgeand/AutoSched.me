// JWT utilities: sign, verify, and manage session cookies
import jwt from 'jsonwebtoken';
import { Response, Request } from 'express';

export function signJwt(payload: object, expiry: Date) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: Math.floor((expiry.getTime() - Date.now()) / 1000) });
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, token: string, expiry: Date) {
  res.cookie('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiry,
    sameSite: 'lax'
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie('session');
}

export function getTokenFromRequest(req: Request) {
  return req.cookies?.session || req.headers.authorization?.split(' ')[1];
}
