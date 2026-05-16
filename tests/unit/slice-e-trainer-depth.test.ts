import { describe, expect, test } from 'bun:test';
import { ILLUSTRIOUS_18, correctActionForIndex } from '../../src/services/deviation-indices';
import { generateCountDrill, hiLoValue } from '../../src/services/count-drill';

describe('Illustrious 18 deviation indices', () => {
  test('contains 18 entries', () => {
    expect(ILLUSTRIOUS_18.length).toBe(18);
  });

  test('16 vs 10 stands at TC >= 0 and hits at TC -1', () => {
    const idx = ILLUSTRIOUS_18.find((i) => i.id === '16v10')!;
    expect(correctActionForIndex(idx, 0)).toBe('STAND');
    expect(correctActionForIndex(idx, 5)).toBe('STAND');
    expect(correctActionForIndex(idx, -1)).toBe('HIT');
  });

  test('12 vs 4 stands at TC 1 and hits at TC 0 (lte deviation)', () => {
    const idx = ILLUSTRIOUS_18.find((i) => i.id === '12v4')!;
    expect(correctActionForIndex(idx, 1)).toBe('STAND');
    expect(correctActionForIndex(idx, 0)).toBe('HIT');
    expect(correctActionForIndex(idx, -3)).toBe('HIT');
  });

  test('every entry has consistent compare/threshold semantics', () => {
    for (const idx of ILLUSTRIOUS_18) {
      expect(['gte', 'lte']).toContain(idx.compare);
      expect(Number.isInteger(idx.threshold)).toBe(true);
      // Most indices have distinct default vs deviation; insurance is a no-op pair (HIT/HIT).
      if (idx.id !== 'insurance') expect(idx.defaultAction).not.toBe(idx.deviation);
    }
  });
});

describe('Hi-Lo count drill', () => {
  test('hiLoValue tags cards correctly', () => {
    expect(hiLoValue('2')).toBe(1);
    expect(hiLoValue('6')).toBe(1);
    expect(hiLoValue('7')).toBe(0);
    expect(hiLoValue('9')).toBe(0);
    expect(hiLoValue('10')).toBe(-1);
    expect(hiLoValue('A')).toBe(-1);
  });

  test('generateCountDrill returns matching card count and consistent running count', () => {
    const drill = generateCountDrill(30, 4);
    expect(drill.cards.length).toBe(30);
    const recomputed = drill.cards.reduce((sum, c) => sum + hiLoValue(c), 0);
    expect(drill.runningCount).toBe(recomputed);
    expect(drill.trueCount).toBe(Math.round(drill.runningCount / 4));
  });

  test('defaults to 20 cards across 4 decks', () => {
    const drill = generateCountDrill();
    expect(drill.cards.length).toBe(20);
    expect(drill.decksRemaining).toBe(4);
  });
});
