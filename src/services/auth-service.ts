import { prisma } from '../database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../auth/passwords';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../auth/tokens';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';
import type { AuthTokens } from '../types';

function makeTokens(userId: string): AuthTokens {
  return {
    accessToken: generateAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
  };
}

export async function register(email: string, name: string, password: string): Promise<AuthTokens> {
  const strengthErrors = validatePasswordStrength(password);
  if (strengthErrors.length > 0) {
    throw new ValidationError(strengthErrors.map((message) => ({ message })));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('Email already in use');

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });

  return makeTokens(user.id);
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) throw new UnauthorizedError('Invalid credentials');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  return makeTokens(user.id);
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const { sub } = verifyRefreshToken(refreshToken);
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) throw new UnauthorizedError('User not found');

  return makeTokens(user.id);
}

export async function logout(_userId: string): Promise<void> {
  // Stateless JWT — no-op until refresh token blacklist is implemented
}
