import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

export const TOKEN_CONFIG = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  ISSUER: process.env.npm_package_name ?? 'app',
} as const;

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: TOKEN_CONFIG.ACCESS_EXPIRY, issuer: TOKEN_CONFIG.ISSUER }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: TOKEN_CONFIG.REFRESH_EXPIRY, issuer: TOKEN_CONFIG.ISSUER }
  );
}

export function verifyAccessToken(token: string): { sub: string } {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      issuer: TOKEN_CONFIG.ISSUER,
    }) as jwt.JwtPayload;

    if (payload.type !== 'access') throw new Error('Wrong token type');
    return { sub: payload.sub! };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): { sub: string } {
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
      issuer: TOKEN_CONFIG.ISSUER,
    }) as jwt.JwtPayload;

    if (payload.type !== 'refresh') throw new Error('Wrong token type');
    return { sub: payload.sub! };
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}
