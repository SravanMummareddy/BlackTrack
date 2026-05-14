import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/appdb';
process.env.JWT_SECRET ??= 'blackstack-test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'blackstack-test-refresh-secret';
process.env.LOG_LEVEL ??= 'error';

type AppModule = typeof import('../../src/index');
type DatabaseModule = typeof import('../../src/database');
type StrategyServiceModule = typeof import('../../src/services/strategy-service');

let app: AppModule['app'];
let prisma: DatabaseModule['prisma'];
let buildScenarioSeedData: StrategyServiceModule['buildScenarioSeedData'];

const testRunId = `itest_${Date.now()}`;
const email = `${testRunId}@example.com`;
const password = 'StrongPass123';
const name = 'Integration Tester';

let accessToken = '';
let refreshToken = '';
let sessionId = '';
let scenarioId = '';

beforeAll(async () => {
  ({ app } = await import('../../src/index'));
  ({ prisma } = await import('../../src/database'));
  ({ buildScenarioSeedData } = await import('../../src/services/strategy-service'));

  await prisma.strategyScenario.createMany({
    data: buildScenarioSeedData(),
    skipDuplicates: true,
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: 'itest_',
      },
    },
  });

  await prisma.$disconnect();
});

describe('API integration', () => {
  test('health endpoints are public', async () => {
    const [healthResponse, liveResponse] = await Promise.all([
      request(app).get('/api/v1/health'),
      request(app).get('/api/v1/health/live'),
    ]);

    expect([200, 503]).toContain(healthResponse.status);
    expect(healthResponse.body).toHaveProperty('status');
    expect(liveResponse.status).toBe(200);
    expect(liveResponse.body.status).toBe('ok');
  });

  test('auth flow works end to end', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email, password, name });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.accessToken).toBeString();
    expect(registerResponse.body.data.refreshToken).toBeString();

    accessToken = registerResponse.body.data.accessToken;
    refreshToken = registerResponse.body.data.refreshToken;

    const meResponse = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.email).toBe(email);
    expect(meResponse.body.data.name).toBe(name);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.accessToken).toBeString();
    expect(loginResponse.body.data.refreshToken).toBeString();

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.data.accessToken).toBeString();
    expect(refreshResponse.body.data.refreshToken).toBeString();

    accessToken = refreshResponse.body.data.accessToken;

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(logoutResponse.status).toBe(204);
  });

  test('session, hand, and stats flow works end to end', async () => {
    const createSessionResponse = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        casinoName: 'Bellagio',
        tableMin: 2500,
        tableMax: 20000,
        decks: 6,
        buyIn: 30000,
        notes: 'Integration test session',
      });

    expect(createSessionResponse.status).toBe(201);
    expect(createSessionResponse.body.data.status).toBe('ACTIVE');
    sessionId = createSessionResponse.body.data.id;

    const listSessionsResponse = await request(app)
      .get('/api/v1/sessions?page=1&pageSize=20')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listSessionsResponse.status).toBe(200);
    expect(listSessionsResponse.body.pagination.page).toBe(1);
    expect(listSessionsResponse.body.data.some((session: { id: string }) => session.id === sessionId)).toBe(true);

    const logHandResponse = await request(app)
      .post(`/api/v1/sessions/${sessionId}/hands`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        bet: 2500,
        result: 'WIN',
        playerCards: ['A', '8'],
        dealerCards: ['6', '10'],
        playerTotal: 19,
        dealerTotal: 16,
        splitHand: false,
        doubled: false,
        surrendered: false,
        payout: 2500,
      });

    expect(logHandResponse.status).toBe(201);
    expect(logHandResponse.body.data.handNumber).toBe(1);

    const handsResponse = await request(app)
      .get(`/api/v1/sessions/${sessionId}/hands?page=1&pageSize=20`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(handsResponse.status).toBe(200);
    expect(handsResponse.body.data).toHaveLength(1);
    expect(handsResponse.body.data[0].result).toBe('WIN');

    const sessionStatsResponse = await request(app)
      .get(`/api/v1/sessions/${sessionId}/hands/stats`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(sessionStatsResponse.status).toBe(200);
    expect(sessionStatsResponse.body.data.handsPlayed).toBe(1);
    expect(sessionStatsResponse.body.data.handsWon).toBe(1);
    expect(sessionStatsResponse.body.data.totalBet).toBe(2500);

    const completeSessionResponse = await request(app)
      .patch(`/api/v1/sessions/${sessionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        cashOut: 32500,
        status: 'COMPLETED',
      });

    expect(completeSessionResponse.status).toBe(200);
    expect(completeSessionResponse.body.data.status).toBe('COMPLETED');
    expect(completeSessionResponse.body.data.cashOut).toBe(32500);

    const userStatsResponse = await request(app)
      .get('/api/v1/users/me/stats')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(userStatsResponse.status).toBe(200);
    expect(userStatsResponse.body.data.period).toBe('all');
    expect(userStatsResponse.body.data.sessionsPlayed).toBeGreaterThanOrEqual(1);
    expect(userStatsResponse.body.data.completedSessions).toBeGreaterThanOrEqual(1);
    expect(userStatsResponse.body.data.sessionsWon).toBeGreaterThanOrEqual(1);
    expect(userStatsResponse.body.data.handsPlayed).toBeGreaterThanOrEqual(1);
    expect(userStatsResponse.body.data.totalBuyIn).toBeGreaterThanOrEqual(30000);
    expect(userStatsResponse.body.data.averageSessionNet).toBeGreaterThanOrEqual(2500);
    expect(Array.isArray(userStatsResponse.body.data.topCasinos)).toBe(true);
    expect(userStatsResponse.body.data.topCasinos[0].casinoName).toBe('Bellagio');
    expect(userStatsResponse.body.data.topCasinos[0].netProfit).toBeGreaterThanOrEqual(2500);

    const monthStatsResponse = await request(app)
      .get('/api/v1/users/me/stats?period=month')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(monthStatsResponse.status).toBe(200);
    expect(monthStatsResponse.body.data.period).toBe('month');
    expect(monthStatsResponse.body.data.windowStart).toBeString();
    expect(monthStatsResponse.body.data.sessionsPlayed).toBeGreaterThanOrEqual(1);
  });

  test('strategy flow works end to end', async () => {
    const scenarioResponse = await request(app)
      .get('/api/v1/strategy/scenarios/random')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(scenarioResponse.status).toBe(200);
    expect(scenarioResponse.body.data.id).toBeString();
    scenarioId = scenarioResponse.body.data.id;

    const scenarioByIdResponse = await request(app)
      .get(`/api/v1/strategy/scenarios/${scenarioId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(scenarioByIdResponse.status).toBe(200);
    expect(scenarioByIdResponse.body.data.id).toBe(scenarioId);

    const wrongAction = scenarioResponse.body.data.correctAction === 'HIT' ? 'STAND' : 'HIT';
    const incorrectAttemptResponse = await request(app)
      .post('/api/v1/strategy/attempts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenarioId,
        action: wrongAction,
        timeMs: 1800,
      });

    expect(incorrectAttemptResponse.status).toBe(201);
    expect(incorrectAttemptResponse.body.data.evaluation.correct).toBe(false);

    const attemptResponse = await request(app)
      .post('/api/v1/strategy/attempts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenarioId,
        action: scenarioResponse.body.data.correctAction,
        timeMs: 1200,
      });

    expect(attemptResponse.status).toBe(201);
    expect(attemptResponse.body.data.attempt.scenarioId).toBe(scenarioId);
    expect(attemptResponse.body.data.evaluation.correct).toBe(true);

    const progressResponse = await request(app)
      .get('/api/v1/strategy/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(progressResponse.status).toBe(200);
    expect(progressResponse.body.data.attempts).toBeGreaterThanOrEqual(2);
    expect(progressResponse.body.data.correct).toBeGreaterThanOrEqual(1);
    expect(progressResponse.body.data.averageResponseTimeMs).toBeGreaterThanOrEqual(1200);
    expect(progressResponse.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    expect(progressResponse.body.data.bestStreak).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(progressResponse.body.data.recentMistakes)).toBe(true);
    expect(progressResponse.body.data.recentMistakes[0].scenarioId).toBe(scenarioId);
    expect(progressResponse.body.data.recentMistakes[0].correctAction).toBe(scenarioResponse.body.data.correctAction);
  });
});
