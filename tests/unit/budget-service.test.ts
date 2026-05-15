import { describe, expect, test } from 'bun:test';
import {
  monthStartUtc,
  daysLeftInMonth,
  computePercentUsed,
  classifyState,
  resolveEffectiveBudget,
} from '../../src/services/budget-service';

describe('monthStartUtc', () => {
  test('returns first of month at 00:00 UTC', () => {
    expect(monthStartUtc(new Date('2026-05-15T18:30:00Z')).toISOString())
      .toBe('2026-05-01T00:00:00.000Z');
  });
  test('handles last second of month', () => {
    expect(monthStartUtc(new Date('2026-05-31T23:59:59.999Z')).toISOString())
      .toBe('2026-05-01T00:00:00.000Z');
  });
});

describe('daysLeftInMonth', () => {
  test('first of month returns full length', () => {
    expect(daysLeftInMonth(new Date('2026-05-01T00:00:00Z'))).toBe(31);
  });
  test('mid-month returns remaining (inclusive)', () => {
    expect(daysLeftInMonth(new Date('2026-05-15T12:00:00Z'))).toBe(17);
  });
  test('last day of month returns 1', () => {
    expect(daysLeftInMonth(new Date('2026-05-31T23:59:59Z'))).toBe(1);
  });
  test('leap February', () => {
    expect(daysLeftInMonth(new Date('2028-02-01T00:00:00Z'))).toBe(29);
  });
});

describe('computePercentUsed', () => {
  test('null budget returns null', () => {
    expect(computePercentUsed(1000, null)).toBe(null);
  });
  test('zero usage', () => {
    expect(computePercentUsed(0, 50000)).toBe(0);
  });
  test('partial usage rounds', () => {
    expect(computePercentUsed(23000, 50000)).toBe(46);
  });
  test('exact 100', () => {
    expect(computePercentUsed(50000, 50000)).toBe(100);
  });
  test('over 100 is uncapped', () => {
    expect(computePercentUsed(75000, 50000)).toBe(150);
  });
});

describe('classifyState', () => {
  test('null percent', () => { expect(classifyState(null)).toBe(null); });
  test('boundaries', () => {
    expect(classifyState(0)).toBe('ok');
    expect(classifyState(74)).toBe('ok');
    expect(classifyState(75)).toBe('caution');
    expect(classifyState(99)).toBe('caution');
    expect(classifyState(100)).toBe('over');
    expect(classifyState(200)).toBe('over');
  });
});

describe('resolveEffectiveBudget', () => {
  const settings = [
    { id: 'a', userId: 'u', amountCents: 30000, effectiveFrom: new Date('2026-01-01T00:00:00Z'), createdAt: new Date(), updatedAt: new Date() },
    { id: 'b', userId: 'u', amountCents: 50000, effectiveFrom: new Date('2026-04-01T00:00:00Z'), createdAt: new Date(), updatedAt: new Date() },
    { id: 'c', userId: 'u', amountCents: 70000, effectiveFrom: new Date('2026-07-01T00:00:00Z'), createdAt: new Date(), updatedAt: new Date() },
  ];

  test('null when nothing applies', () => {
    expect(resolveEffectiveBudget(settings, new Date('2025-12-01T00:00:00Z'))).toBe(null);
  });
  test('latest setting on/before target month', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-05-01T00:00:00Z'))?.amountCents).toBe(50000);
  });
  test('exact match', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-04-01T00:00:00Z'))?.amountCents).toBe(50000);
  });
  test('future months use most recent past row', () => {
    expect(resolveEffectiveBudget(settings, new Date('2026-09-01T00:00:00Z'))?.amountCents).toBe(70000);
  });
  test('empty list', () => {
    expect(resolveEffectiveBudget([], new Date('2026-05-01T00:00:00Z'))).toBe(null);
  });
});
