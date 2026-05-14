import { describe, expect, test } from 'bun:test';
import {
  evaluateScenario,
  buildScenarioSeedData,
} from '../../src/services/strategy-service';

// Minimal scenario fixture
function scenario(overrides: Partial<Parameters<typeof evaluateScenario>[0]> = {}) {
  return {
    playerCards: ['9', '2'],
    dealerUpcard: '6' as const,
    playerTotal: 11,
    isSoft: false,
    isPair: false,
    correctAction: 'DOUBLE' as const,
    ...overrides,
  };
}

describe('evaluateScenario', () => {
  test('marks correct action as correct', () => {
    const result = evaluateScenario(scenario(), 'DOUBLE');
    expect(result.correct).toBe(true);
    expect(result.action).toBe('DOUBLE');
    expect(result.correctAction).toBe('DOUBLE');
  });

  test('marks wrong action as incorrect', () => {
    const result = evaluateScenario(scenario(), 'HIT');
    expect(result.correct).toBe(false);
    expect(result.correctAction).toBe('DOUBLE');
  });

  test('returns non-empty reasoning and ruleOfThumb', () => {
    const result = evaluateScenario(scenario(), 'DOUBLE');
    expect(result.reasoning.length).toBeGreaterThan(0);
    expect(result.ruleOfThumb.length).toBeGreaterThan(0);
  });

  test('correct is always action === correctAction', () => {
    const actions = ['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER'] as const;
    const s = scenario({ correctAction: 'STAND' });
    for (const action of actions) {
      const result = evaluateScenario(s, action);
      expect(result.correct).toBe(action === 'STAND');
    }
  });
});

describe('buildScenarioSeedData', () => {
  const seed = buildScenarioSeedData();

  test('produces 350 scenarios', () => {
    expect(seed.length).toBe(350);
  });

  test('every scenario has required fields', () => {
    for (const s of seed) {
      expect(Array.isArray(s.playerCards)).toBe(true);
      expect(s.playerCards.length).toBeGreaterThanOrEqual(1);
      expect(typeof s.dealerUpcard).toBe('string');
      expect(typeof s.playerTotal).toBe('number');
      expect(typeof s.isSoft).toBe('boolean');
      expect(typeof s.isPair).toBe('boolean');
      expect(['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER']).toContain(s.correctAction);
    }
  });

  test('difficulty is always 1, 2, or 3', () => {
    for (const s of seed) {
      expect([1, 2, 3]).toContain(s.difficulty);
    }
  });

  test('no duplicate (playerCards, dealerUpcard, isSoft, isPair) combinations', () => {
    const keys = seed.map((s) =>
      JSON.stringify([s.playerCards, s.dealerUpcard, s.isSoft, s.isPair])
    );
    const unique = new Set(keys);
    expect(unique.size).toBe(seed.length);
  });

  // Spot-check specific strategy table entries
  test('hard 11 vs 10 is DOUBLE', () => {
    const s = seed.find((x) => !x.isSoft && !x.isPair && x.playerTotal === 11 && x.dealerUpcard === '10');
    expect(s?.correctAction).toBe('DOUBLE');
  });

  test('hard 16 vs 7 is HIT', () => {
    const s = seed.find((x) => !x.isSoft && !x.isPair && x.playerTotal === 16 && x.dealerUpcard === '7');
    expect(s?.correctAction).toBe('HIT');
  });

  test('hard 16 vs 6 is STAND', () => {
    const s = seed.find((x) => !x.isSoft && !x.isPair && x.playerTotal === 16 && x.dealerUpcard === '6');
    expect(s?.correctAction).toBe('STAND');
  });

  test('pair of Aces vs any dealer is SPLIT', () => {
    const aces = seed.filter((x) => x.isPair && x.playerCards[0] === 'A');
    expect(aces.length).toBe(10);
    expect(aces.every((x) => x.correctAction === 'SPLIT')).toBe(true);
  });

  test('pair of 8s vs any dealer is SPLIT', () => {
    const eights = seed.filter((x) => x.isPair && x.playerCards[0] === '8');
    expect(eights.length).toBe(10);
    expect(eights.every((x) => x.correctAction === 'SPLIT')).toBe(true);
  });

  test('pair of 10s vs any dealer is STAND', () => {
    const tens = seed.filter((x) => x.isPair && x.playerCards[0] === '10');
    expect(tens.length).toBe(10);
    expect(tens.every((x) => x.correctAction === 'STAND')).toBe(true);
  });

  test('soft 18 (A+7) vs 3 is DOUBLE', () => {
    const s = seed.find((x) => x.isSoft && !x.isPair && x.playerTotal === 18 && x.dealerUpcard === '3');
    expect(s?.correctAction).toBe('DOUBLE');
  });

  test('soft 18 (A+7) vs 2 is STAND', () => {
    const s = seed.find((x) => x.isSoft && !x.isPair && x.playerTotal === 18 && x.dealerUpcard === '2');
    expect(s?.correctAction).toBe('STAND');
  });
});
