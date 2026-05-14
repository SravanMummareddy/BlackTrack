import { prisma } from '../database';
import { generateAccessToken, generateRefreshToken } from './tokens';
import type { AuthTokens } from '../types';

type OAuthProvider = 'google' | 'github';

interface OAuthProfile {
  id: string;
  email: string;
  name: string;
}

export async function handleOAuthCallback(
  provider: OAuthProvider,
  code: string
): Promise<AuthTokens> {
  const profile = await exchangeCodeForProfile(provider, code);

  const user = await prisma.user.upsert({
    where: { email: profile.email },
    create: {
      email: profile.email,
      name: profile.name,
      oauthProvider: provider,
      oauthId: profile.id,
    },
    update: {
      name: profile.name,
      oauthProvider: provider,
      oauthId: profile.id,
    },
  });

  return {
    accessToken: generateAccessToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  };
}

async function exchangeCodeForProfile(
  provider: OAuthProvider,
  code: string
): Promise<OAuthProfile> {
  // Replace with actual OAuth token exchange for each provider
  if (provider === 'google') {
    return exchangeGoogleCode(code);
  }
  if (provider === 'github') {
    return exchangeGithubCode(code);
  }
  throw new Error(`Unsupported OAuth provider: ${provider}`);
}

async function exchangeGoogleCode(code: string): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.OAUTH_CALLBACK_URL!,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json() as { access_token: string };

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = await profileRes.json() as { id: string; email: string; name: string };
  return { id: profile.id, email: profile.email, name: profile.name };
}

async function exchangeGithubCode(code: string): Promise<OAuthProfile> {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokens = await tokenRes.json() as { access_token: string };

  const profileRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = await profileRes.json() as { id: number; email: string; name: string };
  return { id: String(profile.id), email: profile.email, name: profile.name };
}
