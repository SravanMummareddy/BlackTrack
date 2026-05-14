# Authentication Patterns

---

## JWT Implementation

### Token Constants
```typescript
// src/auth/tokens.ts
export const TOKEN_CONFIG = {
  ACCESS_EXPIRY: '15m',
  REFRESH_EXPIRY: '7d',
  ISSUER: '[PROJECT_NAME]',
} as const;
```

### Generating Tokens
```typescript
import jwt from 'jsonwebtoken';

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
```

### Verifying Tokens
```typescript
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
```

---

## Token Refresh Strategy

```typescript
// POST /api/auth/refresh
export async function refreshTokens(refreshToken: string) {
  const payload = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET!
  ) as jwt.JwtPayload;

  if (payload.type !== 'refresh') throw new UnauthorizedError();

  // Check token is not revoked (store revoked tokens in Redis)
  const isRevoked = await redis.get(`revoked:${refreshToken}`);
  if (isRevoked) throw new UnauthorizedError('Token has been revoked');

  const userId = payload.sub!;
  const newAccessToken = generateAccessToken(userId);
  const newRefreshToken = generateRefreshToken(userId);

  // Revoke old refresh token (rotation strategy)
  await redis.setex(`revoked:${refreshToken}`, 7 * 24 * 3600, '1');

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

---

## HTTP-only Cookies (Browser Clients)

```typescript
// Set tokens in cookies after login
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
});

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/refresh', // only sent to refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## Auth Middleware

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // Try Authorization header first (API clients), then cookie (browser)
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const cookieToken = req.cookies?.accessToken;
  const token = headerToken ?? cookieToken;

  if (!token) throw new UnauthorizedError();

  const { sub } = verifyAccessToken(token);
  req.userId = sub; // attach to request
  next();
}

// Optional auth — attaches userId if present, doesn't fail if absent
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    authenticate(req, _res, next);
  } catch {
    next();
  }
}
```

---

## OAuth2 Flow

```
Client → /api/auth/oauth/google
  → Redirect to Google with state param
  → Google → /api/auth/oauth/google/callback?code=...&state=...
  → Exchange code for Google tokens
  → Upsert user in DB
  → Issue our JWT tokens
  → Redirect to frontend with tokens in cookies
```

```typescript
// src/auth/oauth.ts
export async function handleOAuthCallback(
  provider: 'google' | 'github',
  code: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const profile = await exchangeCodeForProfile(provider, code);

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    create: {
      email: profile.email,
      name: profile.name,
      oauthProvider: provider,
      oauthId: profile.id,
    },
    update: { name: profile.name },
  });

  return {
    accessToken: generateAccessToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  };
}
```

---

## Protecting Endpoints

```typescript
// Apply globally, exclude public routes
app.use('/api', authenticate);

// Or per-router
router.get('/me', authenticate, getProfileHandler);
router.post('/login', loginHandler);     // no auth
router.post('/register', registerHandler); // no auth
```
