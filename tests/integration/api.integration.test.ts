import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://postgres:postgres@localhost:5432/appdb';
process.env.JWT_SECRET ??= 'blackstack-test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'blackstack-test-refresh-secret';
process.env.LOG_LEVEL ??= 'error';

type AppModule = typeof import('../../src/app');
type DatabaseModule = typeof import('../../src/database');
type StrategyServiceModule = typeof import('../../src/services/strategy-service');

let app: AppModule['app'];
let prisma: DatabaseModule['prisma'];
let buildScenarioSeedData: StrategyServiceModule['buildScenarioSeedData'];

const testRunId = `itest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const email = `${testRunId}@example.com`;
const password = 'StrongPass123';
const name = 'Integration Tester';

let accessToken = '';
let refreshToken = '';
let sessionId = '';
let scenarioId = '';

beforeAll(async () => {
  ({ app } = await import('../../src/app'));
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
        tags: ['disciplined', 'heads-up'],
        moodStart: 4,
      });

    expect(createSessionResponse.status).toBe(201);
    expect(createSessionResponse.body.data.status).toBe('ACTIVE');
    expect(createSessionResponse.body.data.tags).toEqual(['disciplined', 'heads-up']);
    expect(createSessionResponse.body.data.moodStart).toBe(4);
    sessionId = createSessionResponse.body.data.id;

    const listSessionsResponse = await request(app)
      .get('/api/v1/sessions?page=1&pageSize=20')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(listSessionsResponse.status).toBe(200);
    expect(listSessionsResponse.body.pagination.page).toBe(1);
    expect(listSessionsResponse.body.data.some((session: { id: string }) => session.id === sessionId)).toBe(true);
    expect(listSessionsResponse.body.data.find((session: { id: string }) => session.id === sessionId).tags).toEqual([
      'disciplined',
      'heads-up',
    ]);

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
        moodEnd: 5,
        completionNotes: 'Stayed patient and left after the planned shoe.',
      });

    expect(completeSessionResponse.status).toBe(200);
    expect(completeSessionResponse.body.data.status).toBe('COMPLETED');
    expect(completeSessionResponse.body.data.cashOut).toBe(32500);
    expect(completeSessionResponse.body.data.moodEnd).toBe(5);
    expect(completeSessionResponse.body.data.completionNotes).toBe('Stayed patient and left after the planned shoe.');

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

    const moodAnalyticsResponse = await request(app)
      .get('/api/v1/users/me/mood-analytics')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(moodAnalyticsResponse.status).toBe(200);
    expect(moodAnalyticsResponse.body.data.bucket).toBe('start');
    expect(moodAnalyticsResponse.body.data.totalCompletedSessions).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(moodAnalyticsResponse.body.data.buckets)).toBe(true);
    const startMoodBucket = moodAnalyticsResponse.body.data.buckets.find(
      (b: { mood: number | null }) => b.mood === 4
    );
    expect(startMoodBucket).toBeDefined();
    expect(startMoodBucket.sessions).toBeGreaterThanOrEqual(1);

    const endMoodAnalyticsResponse = await request(app)
      .get('/api/v1/users/me/mood-analytics?bucket=end&period=month')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(endMoodAnalyticsResponse.status).toBe(200);
    expect(endMoodAnalyticsResponse.body.data.bucket).toBe('end');
    expect(endMoodAnalyticsResponse.body.data.period).toBe('month');
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

describe('budget', () => {
  async function registerFreshUser(): Promise<{ token: string; userId: string }> {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userEmail = `itest_budget_${suffix}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: 'StrongPass123', name: 'Budget Tester' });
    expect(res.status).toBe(201);
    const token = res.body.data.accessToken as string;
    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    return { token, userId: meRes.body.data.id as string };
  }

  async function seedLosingSession(userId: string, buyIn: number, cashOut: number) {
    return prisma.casinoSession.create({
      data: {
        userId,
        casinoName: 'Test Casino',
        tableMin: 2500,
        tableMax: 20000,
        decks: 6,
        buyIn,
        cashOut,
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });
  }

  test('new user GET returns null budget and numeric daysLeftInMonth', async () => {
    const { token } = await registerFreshUser();
    const res = await request(app)
      .get('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.budgetCents).toBeNull();
    expect(res.body.data.state).toBeNull();
    expect(typeof res.body.data.daysLeftInMonth).toBe('number');
  });

  test('PUT budget then GET reflects budget with state ok and 0% used', async () => {
    const { token } = await registerFreshUser();
    const putRes = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000 });
    expect(putRes.status).toBe(200);

    const getRes = await request(app)
      .get('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.budgetCents).toBe(50000);
    expect(getRes.body.data.state).toBe('ok');
    expect(getRes.body.data.percentUsed).toBe(0);
  });

  test('losing sessions transition state from caution to over', async () => {
    const { token, userId } = await registerFreshUser();
    await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000 });

    await seedLosingSession(userId, 50000, 10000); // -400 loss
    let res = await request(app)
      .get('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.percentUsed).toBe(80);
    expect(res.body.data.state).toBe('caution');

    await seedLosingSession(userId, 30000, 10000); // -200 additional
    res = await request(app)
      .get('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.percentUsed).toBeGreaterThanOrEqual(100);
    expect(res.body.data.state).toBe('over');
  });

  test('PUT with amount below minimum returns 400', async () => {
    const { token } = await registerFreshUser();
    const res = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50 });
    expect(res.status).toBe(400);
  });

  test('PUT with non-month-start effectiveFrom returns 400', async () => {
    const { token } = await registerFreshUser();
    const res = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000, effectiveFrom: '2026-05-15T00:00:00.000Z' });
    expect(res.status).toBe(400);
  });

  test('history returns rows newest first', async () => {
    const { token } = await registerFreshUser();
    const a = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 40000, effectiveFrom: '2026-05-01T00:00:00.000Z' });
    expect(a.status).toBe(200);
    const b = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 60000, effectiveFrom: '2026-06-01T00:00:00.000Z' });
    expect(b.status).toBe(200);

    const hist = await request(app)
      .get('/api/v1/users/me/budget/history')
      .set('Authorization', `Bearer ${token}`);
    expect(hist.status).toBe(200);
    expect(Array.isArray(hist.body.data)).toBe(true);
    expect(hist.body.data.length).toBe(2);
    const first = new Date(hist.body.data[0].effectiveFrom).getTime();
    const second = new Date(hist.body.data[1].effectiveFrom).getTime();
    expect(first).toBeGreaterThan(second);
    expect(hist.body.data[0].amountCents).toBe(60000);
    expect(hist.body.data[1].amountCents).toBe(40000);
  });
});

describe('correction flows', () => {
  async function registerCorrectionUser(): Promise<{ token: string }> {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userEmail = `itest_correction_${suffix}@example.com`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: 'StrongPass123', name: 'Correction Tester' });
    expect(res.status).toBe(201);
    return { token: res.body.data.accessToken as string };
  }

  async function createCorrectionSession(token: string): Promise<string> {
    const res = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Aria',
        tableMin: 2500,
        tableMax: 20000,
        decks: 6,
        buyIn: 40000,
        notes: 'Original table notes',
        moodStart: 3,
      });
    expect(res.status).toBe(201);
    return res.body.data.id as string;
  }

  test('hand edit and delete recalculates session counters and live profit', async () => {
    const { token } = await registerCorrectionUser();
    const correctionSessionId = await createCorrectionSession(token);

    const handRes = await request(app)
      .post(`/api/v1/sessions/${correctionSessionId}/hands`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bet: 2500,
        result: 'LOSS',
        playerCards: ['10', '6'],
        dealerCards: ['9', '8'],
        playerTotal: 16,
        dealerTotal: 17,
        payout: -2500,
      });
    expect(handRes.status).toBe(201);
    const handId = handRes.body.data.id as string;

    let sessionRes = await request(app)
      .get(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.data.handsPlayed).toBe(1);
    expect(sessionRes.body.data.handsWon).toBe(0);
    expect(sessionRes.body.data.liveNetProfit).toBe(-2500);

    const editRes = await request(app)
      .patch(`/api/v1/sessions/${correctionSessionId}/hands/${handId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        result: 'WIN',
        dealerCards: ['9', '6', '5'],
        dealerTotal: 20,
        payout: 2500,
      });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.result).toBe('WIN');

    sessionRes = await request(app)
      .get(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.data.handsPlayed).toBe(1);
    expect(sessionRes.body.data.handsWon).toBe(1);
    expect(sessionRes.body.data.liveNetProfit).toBe(2500);

    const deleteRes = await request(app)
      .delete(`/api/v1/sessions/${correctionSessionId}/hands/${handId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const statsRes = await request(app)
      .get(`/api/v1/sessions/${correctionSessionId}/hands/stats`)
      .set('Authorization', `Bearer ${token}`);
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.handsPlayed).toBe(0);
    expect(statsRes.body.data.handsWon).toBe(0);
    expect(statsRes.body.data.totalBet).toBe(0);
    expect(statsRes.body.data.liveNetProfit).toBe(0);
  });

  test('session edit, reopen, and delete are available for correction', async () => {
    const { token } = await registerCorrectionUser();
    const correctionSessionId = await createCorrectionSession(token);

    const editRes = await request(app)
      .patch(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Aria High Limit',
        tableMin: 5000,
        tableMax: 50000,
        decks: 8,
        buyIn: 60000,
        moodStart: 4,
        notes: 'Corrected table and buy-in.',
      });
    expect(editRes.status).toBe(200);
    expect(editRes.body.data.casinoName).toBe('Aria High Limit');
    expect(editRes.body.data.tableMin).toBe(5000);
    expect(editRes.body.data.tableMax).toBe(50000);
    expect(editRes.body.data.decks).toBe(8);
    expect(editRes.body.data.buyIn).toBe(60000);
    expect(editRes.body.data.moodStart).toBe(4);

    const completeRes = await request(app)
      .patch(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'COMPLETED', cashOut: 52000, moodEnd: 2 });
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.endedAt).toBeString();

    const reopenRes = await request(app)
      .patch(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ACTIVE' });
    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data.status).toBe('ACTIVE');
    expect(reopenRes.body.data.endedAt).toBeNull();
    expect(reopenRes.body.data.cashOut).toBeNull();

    const deleteRes = await request(app)
      .delete(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const getDeletedRes = await request(app)
      .get(`/api/v1/sessions/${correctionSessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getDeletedRes.status).toBe(404);
  });
});

describe('account lifecycle', () => {
  async function registerAccountUser(): Promise<{ token: string; email: string; password: string }> {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const userEmail = `itest_account_${suffix}@example.com`;
    const userPassword = 'StrongPass123';
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: userEmail, password: userPassword, name: 'Account Tester' });
    expect(res.status).toBe(201);
    return { token: res.body.data.accessToken as string, email: userEmail, password: userPassword };
  }

  async function seedAccountData(token: string): Promise<{ sessionId: string }> {
    const sessionRes = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Cosmopolitan',
        tableMin: 2500,
        tableMax: 20000,
        decks: 6,
        buyIn: 30000,
      });
    expect(sessionRes.status).toBe(201);
    const accountSessionId = sessionRes.body.data.id as string;

    const handRes = await request(app)
      .post(`/api/v1/sessions/${accountSessionId}/hands`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bet: 2500,
        result: 'WIN',
        playerCards: ['A', 'K'],
        dealerCards: ['9', '7'],
        playerTotal: 21,
        dealerTotal: 16,
        payout: 3750,
      });
    expect(handRes.status).toBe(201);

    const budgetRes = await request(app)
      .put('/api/v1/users/me/budget')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 50000 });
    expect(budgetRes.status).toBe(200);

    const scenarioRes = await request(app)
      .get('/api/v1/strategy/scenarios/random')
      .set('Authorization', `Bearer ${token}`);
    expect(scenarioRes.status).toBe(200);

    const attemptRes = await request(app)
      .post('/api/v1/strategy/attempts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scenarioId: scenarioRes.body.data.id,
        action: scenarioRes.body.data.correctAction,
        timeMs: 900,
      });
    expect(attemptRes.status).toBe(201);

    return { sessionId: accountSessionId };
  }

  test('password change requires the current password and allows login with the new password', async () => {
    const { token, email: accountEmail, password: accountPassword } = await registerAccountUser();

    const wrongCurrentRes = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WrongPass123', newPassword: 'NewStrong123' });
    expect(wrongCurrentRes.status).toBe(401);

    const changeRes = await request(app)
      .patch('/api/v1/users/me/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: accountPassword, newPassword: 'NewStrong123' });
    expect(changeRes.status).toBe(204);

    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: accountEmail, password: accountPassword });
    expect(oldLoginRes.status).toBe(401);

    const newLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: accountEmail, password: 'NewStrong123' });
    expect(newLoginRes.status).toBe(200);
    expect(newLoginRes.body.data.accessToken).toBeString();
  });

  test('export returns account data without credential fields', async () => {
    const { token, email: accountEmail } = await registerAccountUser();
    const { sessionId: accountSessionId } = await seedAccountData(token);

    const exportRes = await request(app)
      .get('/api/v1/users/me/export')
      .set('Authorization', `Bearer ${token}`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.data.exportedAt).toBeString();
    expect(exportRes.body.data.user.email).toBe(accountEmail);
    expect(exportRes.body.data.user.passwordHash).toBeUndefined();
    expect(exportRes.body.data.sessions.some((session: { id: string }) => session.id === accountSessionId)).toBe(true);
    const exportedSession = exportRes.body.data.sessions.find((session: { id: string }) => session.id === accountSessionId);
    expect(exportedSession.hands).toHaveLength(1);
    expect(exportRes.body.data.budgetSettings.length).toBeGreaterThanOrEqual(1);
    expect(exportRes.body.data.strategyAttempts.length).toBeGreaterThanOrEqual(1);
  });

  test('delete account requires password and cascades private data', async () => {
    const { token, email: accountEmail, password: accountPassword } = await registerAccountUser();
    await seedAccountData(token);

    const badDeleteRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'WrongPass123' });
    expect(badDeleteRes.status).toBe(401);

    const deleteRes = await request(app)
      .delete('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: accountPassword });
    expect(deleteRes.status).toBe(204);

    const meRes = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(404);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: accountEmail, password: accountPassword });
    expect(loginRes.status).toBe(401);

    const deletedRows = await prisma.user.findMany({
      where: { email: accountEmail },
      include: { sessions: true, strategyAttempts: true, budgetSettings: true },
    });
    expect(deletedRows).toHaveLength(0);
  });

  test('session limits surface live limit state; break mode blocks new sessions', async () => {
    const limitsEmail = `itest_limits_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@example.com`;
    const limitsPassword = 'StrongPass123';

    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: limitsEmail, password: limitsPassword, name: 'Limits Tester' });
    expect(reg.status).toBe(201);
    const token = reg.body.data.accessToken;

    // Create session with both limits.
    const create = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Aria',
        tableMin: 2500,
        tableMax: 20000,
        buyIn: 30000,
        lossLimitCents: 5000,
        timeLimitMinutes: 120,
      });
    expect(create.status).toBe(201);
    expect(create.body.data.lossLimitCents).toBe(5000);
    expect(create.body.data.timeLimitMinutes).toBe(120);
    expect(create.body.data.limitState).toMatchObject({
      lossLimitCents: 5000,
      timeLimitMinutes: 120,
      lossLimitHit: false,
      timeLimitHit: false,
      anyLimitHit: false,
    });
    const limitedSessionId = create.body.data.id;

    // Log a hand that pushes net loss to the cap.
    const handRes = await request(app)
      .post(`/api/v1/sessions/${limitedSessionId}/hands`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        handNumber: 1,
        bet: 5000,
        result: 'LOSS',
        playerCards: ['10', '8'],
        dealerCards: ['10', '9'],
        playerTotal: 18,
        dealerTotal: 19,
        payout: -5000,
      });
    expect(handRes.status).toBe(201);

    const after = await request(app)
      .get(`/api/v1/sessions/${limitedSessionId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(200);
    expect(after.body.data.limitState.netLossCents).toBe(5000);
    expect(after.body.data.limitState.lossLimitHit).toBe(true);
    expect(after.body.data.limitState.anyLimitHit).toBe(true);

    // "Extend" the limit by patching it higher — limit state clears.
    const extend = await request(app)
      .patch(`/api/v1/sessions/${limitedSessionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ lossLimitCents: 20000 });
    expect(extend.status).toBe(200);
    expect(extend.body.data.limitState.lossLimitHit).toBe(false);

    // Break mode — initially inactive.
    const breakBefore = await request(app)
      .get('/api/v1/users/me/break')
      .set('Authorization', `Bearer ${token}`);
    expect(breakBefore.status).toBe(200);
    expect(breakBefore.body.data.active).toBe(false);
    expect(breakBefore.body.data.breakUntil).toBeNull();

    // Set a 24h break.
    const setBreak = await request(app)
      .put('/api/v1/users/me/break')
      .set('Authorization', `Bearer ${token}`)
      .send({ duration: '24h' });
    expect(setBreak.status).toBe(200);
    expect(setBreak.body.data.active).toBe(true);
    expect(typeof setBreak.body.data.breakUntil).toBe('string');

    // New session creation is now blocked.
    const blocked = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Aria',
        tableMin: 2500,
        tableMax: 20000,
        buyIn: 30000,
      });
    expect(blocked.status).toBe(403);

    // Clearing the break re-enables session creation.
    const clearBreak = await request(app)
      .delete('/api/v1/users/me/break')
      .set('Authorization', `Bearer ${token}`);
    expect(clearBreak.status).toBe(200);
    expect(clearBreak.body.data.active).toBe(false);

    const unblocked = await request(app)
      .post('/api/v1/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        casinoName: 'Aria',
        tableMin: 2500,
        tableMax: 20000,
        buyIn: 30000,
      });
    expect(unblocked.status).toBe(201);

    // Invalid duration rejected.
    const badBreak = await request(app)
      .put('/api/v1/users/me/break')
      .set('Authorization', `Bearer ${token}`)
      .send({ duration: '1h' });
    expect(badBreak.status).toBe(400);
  });
});
