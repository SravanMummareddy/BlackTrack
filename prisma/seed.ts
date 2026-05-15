/// <reference types="node" />

import {
  HandResult,
  PrismaClient,
  Role,
  SessionStatus,
  StrategyAction,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type UserSeed = {
  email: string;
  name: string;
  role: Role;
  password?: string;
  oauthProvider?: string;
  oauthId?: string;
};

type SessionSeed = {
  casinoName: string;
  tableMin: number;
  tableMax: number;
  decks: number;
  startedAt: string;
  endedAt?: string;
  status: SessionStatus;
  buyIn: number;
  cashOut?: number;
  notes?: string;
  hands: HandSeed[];
};

type HandSeed = {
  bet: number;
  result: HandResult;
  playerCards: string[];
  dealerCards: string[];
  playerTotal: number;
  dealerTotal: number;
  splitHand?: boolean;
  doubled?: boolean;
  surrendered?: boolean;
  payout: number;
  playedAt: string;
};

type ScenarioSeed = {
  playerCards: string[];
  dealerUpcard: string;
  playerTotal: number;
  isSoft: boolean;
  isPair: boolean;
  correctAction: StrategyAction;
  difficulty: number;
};

type AttemptSeed = {
  action: StrategyAction;
  correct: boolean;
  timeMs: number;
  attemptedAt: string;
};

const scenarioSeeds: ScenarioSeed[] = [
  { playerCards: ['10', '6'], dealerUpcard: '10', playerTotal: 16, isSoft: false, isPair: false, correctAction: StrategyAction.HIT, difficulty: 2 },
  { playerCards: ['8', '8'], dealerUpcard: '10', playerTotal: 16, isSoft: false, isPair: true, correctAction: StrategyAction.SPLIT, difficulty: 3 },
  { playerCards: ['A', '7'], dealerUpcard: '3', playerTotal: 18, isSoft: true, isPair: false, correctAction: StrategyAction.DOUBLE, difficulty: 2 },
  { playerCards: ['9', '9'], dealerUpcard: '7', playerTotal: 18, isSoft: false, isPair: true, correctAction: StrategyAction.STAND, difficulty: 2 },
  { playerCards: ['5', '5'], dealerUpcard: '6', playerTotal: 10, isSoft: false, isPair: true, correctAction: StrategyAction.DOUBLE, difficulty: 1 },
  { playerCards: ['A', '6'], dealerUpcard: '2', playerTotal: 17, isSoft: true, isPair: false, correctAction: StrategyAction.HIT, difficulty: 2 },
  { playerCards: ['10', '2'], dealerUpcard: '4', playerTotal: 12, isSoft: false, isPair: false, correctAction: StrategyAction.STAND, difficulty: 1 },
  { playerCards: ['7', '7'], dealerUpcard: '8', playerTotal: 14, isSoft: false, isPair: true, correctAction: StrategyAction.HIT, difficulty: 2 },
  { playerCards: ['A', '8'], dealerUpcard: '6', playerTotal: 19, isSoft: true, isPair: false, correctAction: StrategyAction.STAND, difficulty: 1 },
  { playerCards: ['6', '3'], dealerUpcard: '4', playerTotal: 9, isSoft: false, isPair: false, correctAction: StrategyAction.DOUBLE, difficulty: 1 },
];

const users: UserSeed[] = [
  {
    email: 'admin@blackstack.app',
    name: 'Morgan Reed',
    role: Role.ADMIN,
    password: 'AdminPass123!',
  },
  {
    email: 'alex.parker@example.com',
    name: 'Alex Parker',
    role: Role.USER,
    password: 'PlayerPass123!',
  },
  {
    email: 'danielle.cho@example.com',
    name: 'Danielle Cho',
    role: Role.USER,
    oauthProvider: 'google',
    oauthId: 'google-danielle-cho-001',
  },
  {
    email: 'marcus.hill@example.com',
    name: 'Marcus Hill',
    role: Role.USER,
    password: 'PlayerPass123!',
  },
];

const sessionSeedsByEmail: Record<string, SessionSeed[]> = {
  'admin@blackstack.app': [
    {
      casinoName: 'Bellagio Las Vegas',
      tableMin: 2500,
      tableMax: 50000,
      decks: 6,
      startedAt: '2026-04-02T20:15:00.000Z',
      endedAt: '2026-04-02T21:05:00.000Z',
      status: SessionStatus.COMPLETED,
      buyIn: 30000,
      cashOut: 37250,
      notes: 'Crowded pit, mostly tourists, dealer pace stayed fast.',
      hands: [
        { bet: 2500, result: HandResult.WIN, playerCards: ['10', '9'], dealerCards: ['8', '10'], playerTotal: 19, dealerTotal: 18, payout: 2500, playedAt: '2026-04-02T20:18:00.000Z' },
        { bet: 2500, result: HandResult.LOSS, playerCards: ['10', '6', '4'], dealerCards: ['9', '8', '4'], playerTotal: 20, dealerTotal: 21, payout: -2500, playedAt: '2026-04-02T20:22:00.000Z' },
        { bet: 5000, result: HandResult.BLACKJACK, playerCards: ['A', 'K'], dealerCards: ['10', '7'], playerTotal: 21, dealerTotal: 17, payout: 7500, playedAt: '2026-04-02T20:28:00.000Z' },
        { bet: 2500, result: HandResult.PUSH, playerCards: ['9', '8'], dealerCards: ['10', '7'], playerTotal: 17, dealerTotal: 17, payout: 0, playedAt: '2026-04-02T20:33:00.000Z' },
        { bet: 2500, result: HandResult.WIN, playerCards: ['6', '5', '10'], dealerCards: ['7', '8'], playerTotal: 21, dealerTotal: 15, payout: 2500, playedAt: '2026-04-02T20:40:00.000Z' },
        { bet: 5000, result: HandResult.LOSS, playerCards: ['9', '2', '8'], dealerCards: ['10', '8', '2'], playerTotal: 19, dealerTotal: 20, doubled: true, payout: -5000, playedAt: '2026-04-02T20:48:00.000Z' },
      ],
    },
  ],
  'alex.parker@example.com': [
    {
      casinoName: 'Wynn Las Vegas',
      tableMin: 1500,
      tableMax: 20000,
      decks: 6,
      startedAt: '2026-04-10T01:10:00.000Z',
      endedAt: '2026-04-10T02:20:00.000Z',
      status: SessionStatus.COMPLETED,
      buyIn: 20000,
      cashOut: 24800,
      notes: 'Stayed disciplined with bet sizing, left after locking up a decent win.',
      hands: [
        { bet: 1500, result: HandResult.WIN, playerCards: ['8', '8', '3'], dealerCards: ['6', '10', '8'], playerTotal: 19, dealerTotal: 24, splitHand: true, payout: 1500, playedAt: '2026-04-10T01:14:00.000Z' },
        { bet: 1500, result: HandResult.WIN, playerCards: ['8', '8', '2'], dealerCards: ['6', '10', '8'], playerTotal: 18, dealerTotal: 24, splitHand: true, payout: 1500, playedAt: '2026-04-10T01:17:00.000Z' },
        { bet: 1500, result: HandResult.LOSS, playerCards: ['10', '6'], dealerCards: ['10', '9'], playerTotal: 16, dealerTotal: 19, payout: -1500, playedAt: '2026-04-10T01:24:00.000Z' },
        { bet: 3000, result: HandResult.WIN, playerCards: ['5', '6', '10'], dealerCards: ['4', '10', '9'], playerTotal: 21, dealerTotal: 23, doubled: true, payout: 3000, playedAt: '2026-04-10T01:31:00.000Z' },
        { bet: 1500, result: HandResult.SURRENDER, playerCards: ['10', '6'], dealerCards: ['A', '9'], playerTotal: 16, dealerTotal: 20, surrendered: true, payout: -750, playedAt: '2026-04-10T01:42:00.000Z' },
        { bet: 1500, result: HandResult.BLACKJACK, playerCards: ['A', 'Q'], dealerCards: ['9', '7'], playerTotal: 21, dealerTotal: 16, payout: 2250, playedAt: '2026-04-10T01:55:00.000Z' },
      ],
    },
    {
      casinoName: 'Rivers Casino Des Plaines',
      tableMin: 2500,
      tableMax: 10000,
      decks: 8,
      startedAt: '2026-05-12T23:40:00.000Z',
      status: SessionStatus.ACTIVE,
      buyIn: 15000,
      notes: 'Short local session after work; still mid-run.',
      hands: [
        { bet: 2500, result: HandResult.WIN, playerCards: ['10', '7'], dealerCards: ['9', '6', '8'], playerTotal: 17, dealerTotal: 23, payout: 2500, playedAt: '2026-05-12T23:44:00.000Z' },
        { bet: 2500, result: HandResult.LOSS, playerCards: ['9', '5', '8'], dealerCards: ['10', '8'], playerTotal: 22, dealerTotal: 18, payout: -2500, playedAt: '2026-05-12T23:49:00.000Z' },
        { bet: 2500, result: HandResult.PUSH, playerCards: ['A', '7'], dealerCards: ['9', '9'], playerTotal: 18, dealerTotal: 18, payout: 0, playedAt: '2026-05-12T23:56:00.000Z' },
      ],
    },
  ],
  'danielle.cho@example.com': [
    {
      casinoName: 'MGM National Harbor',
      tableMin: 2500,
      tableMax: 25000,
      decks: 6,
      startedAt: '2026-03-18T00:25:00.000Z',
      endedAt: '2026-03-18T01:45:00.000Z',
      status: SessionStatus.COMPLETED,
      buyIn: 25000,
      cashOut: 19850,
      notes: 'Tough shoe. Dealer kept making 20s against stiff hands.',
      hands: [
        { bet: 2500, result: HandResult.LOSS, playerCards: ['10', '6', '9'], dealerCards: ['10', '7'], playerTotal: 25, dealerTotal: 17, payout: -2500, playedAt: '2026-03-18T00:31:00.000Z' },
        { bet: 2500, result: HandResult.WIN, playerCards: ['A', '6', '4'], dealerCards: ['5', '10', '10'], playerTotal: 21, dealerTotal: 25, doubled: true, payout: 2500, playedAt: '2026-03-18T00:39:00.000Z' },
        { bet: 2500, result: HandResult.PUSH, playerCards: ['10', '8'], dealerCards: ['9', '9'], playerTotal: 18, dealerTotal: 18, payout: 0, playedAt: '2026-03-18T00:48:00.000Z' },
        { bet: 2500, result: HandResult.LOSS, playerCards: ['7', '7', '6'], dealerCards: ['8', '9', '4'], playerTotal: 20, dealerTotal: 21, payout: -2500, playedAt: '2026-03-18T01:00:00.000Z' },
        { bet: 5000, result: HandResult.WIN, playerCards: ['9', '2', 'J'], dealerCards: ['6', '10', '8'], playerTotal: 21, dealerTotal: 24, doubled: true, payout: 5000, playedAt: '2026-03-18T01:14:00.000Z' },
      ],
    },
  ],
  'marcus.hill@example.com': [
    {
      casinoName: 'Caesars Palace',
      tableMin: 1000,
      tableMax: 10000,
      decks: 6,
      startedAt: '2026-02-22T22:05:00.000Z',
      endedAt: '2026-02-22T23:15:00.000Z',
      status: SessionStatus.COMPLETED,
      buyIn: 12000,
      cashOut: 14500,
      notes: 'Started cold, recovered after two doubles connected.',
      hands: [
        { bet: 1000, result: HandResult.LOSS, playerCards: ['10', '5', '10'], dealerCards: ['9', '8'], playerTotal: 25, dealerTotal: 17, payout: -1000, playedAt: '2026-02-22T22:08:00.000Z' },
        { bet: 1000, result: HandResult.WIN, playerCards: ['6', '4', '10'], dealerCards: ['5', '10', '9'], playerTotal: 20, dealerTotal: 24, doubled: true, payout: 1000, playedAt: '2026-02-22T22:14:00.000Z' },
        { bet: 1000, result: HandResult.WIN, playerCards: ['A', '9'], dealerCards: ['7', '10'], playerTotal: 20, dealerTotal: 17, payout: 1000, playedAt: '2026-02-22T22:22:00.000Z' },
        { bet: 1000, result: HandResult.BLACKJACK, playerCards: ['A', 'J'], dealerCards: ['10', '6'], playerTotal: 21, dealerTotal: 16, payout: 1500, playedAt: '2026-02-22T22:35:00.000Z' },
        { bet: 2000, result: HandResult.PUSH, playerCards: ['10', '7'], dealerCards: ['9', '8'], playerTotal: 17, dealerTotal: 17, payout: 0, playedAt: '2026-02-22T22:51:00.000Z' },
      ],
    },
  ],
};

const attemptSeedsByEmail: Record<string, AttemptSeed[]> = {
  'admin@blackstack.app': [
    { action: StrategyAction.HIT, correct: true, timeMs: 2100, attemptedAt: '2026-04-03T18:00:00.000Z' },
    { action: StrategyAction.SPLIT, correct: true, timeMs: 2650, attemptedAt: '2026-04-03T18:02:00.000Z' },
    { action: StrategyAction.STAND, correct: false, timeMs: 1900, attemptedAt: '2026-04-03T18:04:00.000Z' },
    { action: StrategyAction.DOUBLE, correct: true, timeMs: 2400, attemptedAt: '2026-04-03T18:06:00.000Z' },
  ],
  'alex.parker@example.com': [
    { action: StrategyAction.HIT, correct: true, timeMs: 3300, attemptedAt: '2026-05-01T01:10:00.000Z' },
    { action: StrategyAction.HIT, correct: false, timeMs: 2900, attemptedAt: '2026-05-01T01:12:00.000Z' },
    { action: StrategyAction.DOUBLE, correct: true, timeMs: 2600, attemptedAt: '2026-05-01T01:15:00.000Z' },
    { action: StrategyAction.SURRENDER, correct: false, timeMs: 4100, attemptedAt: '2026-05-01T01:20:00.000Z' },
  ],
  'danielle.cho@example.com': [
    { action: StrategyAction.DOUBLE, correct: true, timeMs: 2800, attemptedAt: '2026-04-20T14:05:00.000Z' },
    { action: StrategyAction.STAND, correct: true, timeMs: 2200, attemptedAt: '2026-04-20T14:07:00.000Z' },
    { action: StrategyAction.HIT, correct: true, timeMs: 1950, attemptedAt: '2026-04-20T14:10:00.000Z' },
    { action: StrategyAction.SPLIT, correct: false, timeMs: 3600, attemptedAt: '2026-04-20T14:13:00.000Z' },
  ],
  'marcus.hill@example.com': [
    { action: StrategyAction.STAND, correct: false, timeMs: 3150, attemptedAt: '2026-03-01T20:25:00.000Z' },
    { action: StrategyAction.DOUBLE, correct: true, timeMs: 2750, attemptedAt: '2026-03-01T20:28:00.000Z' },
    { action: StrategyAction.HIT, correct: true, timeMs: 2300, attemptedAt: '2026-03-01T20:31:00.000Z' },
    { action: StrategyAction.STAND, correct: true, timeMs: 1850, attemptedAt: '2026-03-01T20:33:00.000Z' },
  ],
};

function countWins(hands: HandSeed[]): number {
  return hands.filter((hand) =>
    hand.result === HandResult.WIN || hand.result === HandResult.BLACKJACK
  ).length;
}

async function main() {
  await prisma.strategyAttempt.deleteMany();
  await prisma.hand.deleteMany();
  await prisma.strategyScenario.deleteMany();
  await prisma.casinoSession.deleteMany();
  await prisma.user.deleteMany();

  const scenarios = [];
  for (const scenario of scenarioSeeds) {
    scenarios.push(
      await prisma.strategyScenario.create({
        data: scenario,
      })
    );
  }

  const scenarioPool = scenarios;

  let sessionCount = 0;
  let handCount = 0;
  let attemptCount = 0;

  for (const userSeed of users) {
    const passwordHash = userSeed.password
      ? await bcrypt.hash(userSeed.password, 10)
      : null;

    const user = await prisma.user.create({
      data: {
        email: userSeed.email,
        name: userSeed.name,
        role: userSeed.role,
        passwordHash,
        oauthProvider: userSeed.oauthProvider,
        oauthId: userSeed.oauthId,
      },
    });

    const sessions = sessionSeedsByEmail[user.email] ?? [];
    for (const sessionSeed of sessions) {
      const session = await prisma.casinoSession.create({
        data: {
          userId: user.id,
          casinoName: sessionSeed.casinoName,
          tableMin: sessionSeed.tableMin,
          tableMax: sessionSeed.tableMax,
          decks: sessionSeed.decks,
          startedAt: new Date(sessionSeed.startedAt),
          endedAt: sessionSeed.endedAt ? new Date(sessionSeed.endedAt) : null,
          status: sessionSeed.status,
          buyIn: sessionSeed.buyIn,
          cashOut: sessionSeed.cashOut ?? null,
          notes: sessionSeed.notes,
          handsPlayed: sessionSeed.hands.length,
          handsWon: countWins(sessionSeed.hands),
        },
      });

      sessionCount += 1;

      for (let index = 0; index < sessionSeed.hands.length; index += 1) {
        const handSeed = sessionSeed.hands[index];
        await prisma.hand.create({
          data: {
            sessionId: session.id,
            handNumber: index + 1,
            bet: handSeed.bet,
            result: handSeed.result,
            playerCards: handSeed.playerCards,
            dealerCards: handSeed.dealerCards,
            playerTotal: handSeed.playerTotal,
            dealerTotal: handSeed.dealerTotal,
            splitHand: handSeed.splitHand ?? false,
            doubled: handSeed.doubled ?? false,
            surrendered: handSeed.surrendered ?? false,
            payout: handSeed.payout,
            playedAt: new Date(handSeed.playedAt),
          },
        });

        handCount += 1;
      }
    }

    const attempts = attemptSeedsByEmail[user.email] ?? [];
      for (let index = 0; index < attempts.length; index += 1) {
        const attemptSeed = attempts[index];
        const scenario = scenarioPool[index % scenarioPool.length];
      await prisma.strategyAttempt.create({
        data: {
          userId: user.id,
          scenarioId: scenario.id,
          action: attemptSeed.action,
          correct: attemptSeed.correct,
          timeMs: attemptSeed.timeMs,
          attemptedAt: new Date(attemptSeed.attemptedAt),
        },
      });

      attemptCount += 1;
    }
  }

  console.log(
    `Seeded ${users.length} users, ${sessionCount} sessions, ${handCount} hands, ${scenarioSeeds.length} scenarios, and ${attemptCount} attempts.`
  );
  console.log('Login examples:');
  console.log('  admin@blackstack.app / AdminPass123!');
  console.log('  alex.parker@example.com / PlayerPass123!');
  console.log('  marcus.hill@example.com / PlayerPass123!');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
