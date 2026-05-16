import { describe, expect, test } from 'bun:test';
import { buildScenarioSeedData, evaluateScenario } from '../../src/services/strategy-service';
import { HARD, SOFT, PAIR, DEALER_UPCARDS } from '../../src/services/strategy-chart';
import type { StrategyAction } from '@prisma/client';

// Reference chart lives in src/services/strategy-chart.ts so the API can
// serve it; this test verifies the chart still matches the seed-evaluator.

const DEALER = DEALER_UPCARDS;

function expectedAction(s: {
  playerTotal: number;
  isSoft: boolean;
  isPair: boolean;
  playerCards: string[];
  dealerUpcard: string;
}): StrategyAction {
  const col = DEALER.indexOf(s.dealerUpcard as (typeof DEALER)[number]);
  if (col < 0) throw new Error(`unknown dealer upcard: ${s.dealerUpcard}`);

  if (s.isPair) {
    const key = s.playerCards[0];
    const row = PAIR[key];
    if (!row) throw new Error(`unknown pair: ${key}`);
    return row[col];
  }
  if (s.isSoft) {
    const otherCard = s.playerCards.find((c) => c !== 'A');
    if (!otherCard) throw new Error('soft hand missing non-ace card');
    const row = SOFT[otherCard];
    if (!row) throw new Error(`unknown soft hand: A+${otherCard}`);
    return row[col];
  }
  const row = HARD[String(s.playerTotal)];
  if (!row) throw new Error(`unknown hard total: ${s.playerTotal}`);
  return row[col];
}

describe('seed scenarios match independent reference chart', () => {
  const seed = buildScenarioSeedData();

  test('covers 350 scenarios (17 hard + 8 soft + 10 pair) × 10 upcards', () => {
    expect(seed.length).toBe(350);
  });

  for (const s of seed) {
    const label = s.isPair
      ? `pair ${s.playerCards[0]},${s.playerCards[0]} vs ${s.dealerUpcard}`
      : s.isSoft
        ? `soft ${s.playerTotal} (${s.playerCards.join('+')}) vs ${s.dealerUpcard}`
        : `hard ${s.playerTotal} vs ${s.dealerUpcard}`;

    test(label, () => {
      expect(s.correctAction).toBe(expectedAction(s));
    });
  }
});

// High-risk cells: famous edge cases players misplay most often.
// These are intentionally redundant with the exhaustive check above so a
// regression in any of them produces a focused, named failure.
describe('high-risk decisions (locked)', () => {
  function find(predicate: (s: ReturnType<typeof buildScenarioSeedData>[number]) => boolean) {
    const s = buildScenarioSeedData().find(predicate);
    if (!s) throw new Error('scenario not found');
    return s;
  }

  test('hard 16 vs 10 → HIT', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 16 && s.dealerUpcard === '10').correctAction).toBe('HIT');
  });
  test('hard 12 vs 2 → HIT', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 12 && s.dealerUpcard === '2').correctAction).toBe('HIT');
  });
  test('hard 12 vs 3 → HIT', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 12 && s.dealerUpcard === '3').correctAction).toBe('HIT');
  });
  test('hard 12 vs 4 → STAND', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 12 && s.dealerUpcard === '4').correctAction).toBe('STAND');
  });
  test('hard 11 vs A → HIT', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 11 && s.dealerUpcard === 'A').correctAction).toBe('HIT');
  });
  test('hard 9 vs 2 → HIT', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 9 && s.dealerUpcard === '2').correctAction).toBe('HIT');
  });
  test('hard 9 vs 3 → DOUBLE', () => {
    expect(find((s) => !s.isPair && !s.isSoft && s.playerTotal === 9 && s.dealerUpcard === '3').correctAction).toBe('DOUBLE');
  });

  test('soft 18 (A,7) vs 9 → HIT', () => {
    expect(find((s) => !s.isPair && s.isSoft && s.playerTotal === 18 && s.dealerUpcard === '9').correctAction).toBe('HIT');
  });
  test('soft 18 (A,7) vs 2 → STAND', () => {
    expect(find((s) => !s.isPair && s.isSoft && s.playerTotal === 18 && s.dealerUpcard === '2').correctAction).toBe('STAND');
  });
  test('soft 18 (A,7) vs 6 → DOUBLE', () => {
    expect(find((s) => !s.isPair && s.isSoft && s.playerTotal === 18 && s.dealerUpcard === '6').correctAction).toBe('DOUBLE');
  });
  test('soft 17 (A,6) vs 2 → HIT', () => {
    expect(find((s) => !s.isPair && s.isSoft && s.playerTotal === 17 && s.dealerUpcard === '2').correctAction).toBe('HIT');
  });
  test('soft 13 (A,2) vs 5 → DOUBLE', () => {
    expect(find((s) => !s.isPair && s.isSoft && s.playerTotal === 13 && s.dealerUpcard === '5').correctAction).toBe('DOUBLE');
  });

  test('pair A,A vs 10 → SPLIT', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === 'A' && s.dealerUpcard === '10').correctAction).toBe('SPLIT');
  });
  test('pair 8,8 vs 10 → SPLIT', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '8' && s.dealerUpcard === '10').correctAction).toBe('SPLIT');
  });
  test('pair 9,9 vs 7 → STAND', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '9' && s.dealerUpcard === '7').correctAction).toBe('STAND');
  });
  test('pair 9,9 vs A → STAND', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '9' && s.dealerUpcard === 'A').correctAction).toBe('STAND');
  });
  test('pair 5,5 vs 6 → DOUBLE (never split fives)', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '5' && s.dealerUpcard === '6').correctAction).toBe('DOUBLE');
  });
  test('pair 10,10 vs 6 → STAND (never split tens)', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '10' && s.dealerUpcard === '6').correctAction).toBe('STAND');
  });
  test('pair 4,4 vs 5 → SPLIT (DAS)', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '4' && s.dealerUpcard === '5').correctAction).toBe('SPLIT');
  });
  test('pair 7,7 vs 8 → HIT', () => {
    expect(find((s) => s.isPair && s.playerCards[0] === '7' && s.dealerUpcard === '8').correctAction).toBe('HIT');
  });
});

describe('evaluator agrees with reference chart end-to-end', () => {
  test('every seed scenario evaluates as correct when given its reference action', () => {
    for (const s of buildScenarioSeedData()) {
      const expected = expectedAction(s);
      const result = evaluateScenario(s, expected);
      expect(result.correct).toBe(true);
      expect(result.correctAction).toBe(expected);
    }
  });
});
