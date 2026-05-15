import { describe, expect, test } from 'bun:test';
import { buildScenarioSeedData, evaluateScenario } from '../../src/services/strategy-service';
import type { StrategyAction } from '@prisma/client';

// Independent reference: multi-deck, dealer stands soft 17, DAS allowed,
// no surrender. Cells are dealer upcards 2..10,A (10 cells per row).
// Sourced from canonical basic-strategy chart so any drift in the
// implementation is caught here.

type Row = readonly StrategyAction[];

const H: StrategyAction = 'HIT';
const S: StrategyAction = 'STAND';
const D: StrategyAction = 'DOUBLE';
const P: StrategyAction = 'SPLIT';

const HARD: Record<string, Row> = {
  '21': [S, S, S, S, S, S, S, S, S, S],
  '20': [S, S, S, S, S, S, S, S, S, S],
  '19': [S, S, S, S, S, S, S, S, S, S],
  '18': [S, S, S, S, S, S, S, S, S, S],
  '17': [S, S, S, S, S, S, S, S, S, S],
  '16': [S, S, S, S, S, H, H, H, H, H],
  '15': [S, S, S, S, S, H, H, H, H, H],
  '14': [S, S, S, S, S, H, H, H, H, H],
  '13': [S, S, S, S, S, H, H, H, H, H],
  '12': [H, H, S, S, S, H, H, H, H, H],
  '11': [D, D, D, D, D, D, D, D, D, H],
  '10': [D, D, D, D, D, D, D, D, H, H],
  '9':  [H, D, D, D, D, H, H, H, H, H],
  '8':  [H, H, H, H, H, H, H, H, H, H],
  '7':  [H, H, H, H, H, H, H, H, H, H],
  '6':  [H, H, H, H, H, H, H, H, H, H],
  '5':  [H, H, H, H, H, H, H, H, H, H],
};

// Soft hand keyed by the non-Ace card (A+x), so '9' = soft 20.
const SOFT: Record<string, Row> = {
  '9': [S, S, S, S, S, S, S, S, S, S],
  '8': [S, S, S, S, S, S, S, S, S, S],
  '7': [S, D, D, D, D, S, S, H, H, H],
  '6': [H, D, D, D, D, H, H, H, H, H],
  '5': [H, H, D, D, D, H, H, H, H, H],
  '4': [H, H, D, D, D, H, H, H, H, H],
  '3': [H, H, H, D, D, H, H, H, H, H],
  '2': [H, H, H, D, D, H, H, H, H, H],
};

const PAIR: Record<string, Row> = {
  A:    [P, P, P, P, P, P, P, P, P, P],
  '10': [S, S, S, S, S, S, S, S, S, S],
  '9':  [P, P, P, P, P, S, P, P, S, S],
  '8':  [P, P, P, P, P, P, P, P, P, P],
  '7':  [P, P, P, P, P, P, H, H, H, H],
  '6':  [P, P, P, P, P, H, H, H, H, H],
  '5':  [D, D, D, D, D, D, D, D, H, H],
  '4':  [H, H, H, P, P, H, H, H, H, H],
  '3':  [P, P, P, P, P, P, H, H, H, H],
  '2':  [P, P, P, P, P, P, H, H, H, H],
};

const DEALER = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

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
