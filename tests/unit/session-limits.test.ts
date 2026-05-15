import { describe, expect, test } from 'bun:test';
import { computeLimitState } from '../../src/services/session-service';

function session(overrides: Partial<Parameters<typeof computeLimitState>[0]> = {}) {
  return {
    lossLimitCents: null,
    timeLimitMinutes: null,
    startedAt: new Date('2026-05-15T10:00:00Z'),
    endedAt: null,
    ...overrides,
  };
}

const NOW = new Date('2026-05-15T11:00:00Z'); // +60 minutes

describe('computeLimitState', () => {
  test('no limits → nothing hit', () => {
    const state = computeLimitState(session(), 0, NOW);
    expect(state.anyLimitHit).toBe(false);
    expect(state.lossLimitHit).toBe(false);
    expect(state.timeLimitHit).toBe(false);
    expect(state.netLossCents).toBe(0);
    expect(state.elapsedMinutes).toBe(60);
  });

  test('positive liveNetProfit reports zero loss', () => {
    const state = computeLimitState(session({ lossLimitCents: 5000 }), 1200, NOW);
    expect(state.netLossCents).toBe(0);
    expect(state.lossLimitHit).toBe(false);
  });

  test('loss equal to limit triggers loss-limit-hit', () => {
    const state = computeLimitState(session({ lossLimitCents: 5000 }), -5000, NOW);
    expect(state.lossLimitHit).toBe(true);
    expect(state.anyLimitHit).toBe(true);
  });

  test('loss below limit does not trigger', () => {
    const state = computeLimitState(session({ lossLimitCents: 5000 }), -4999, NOW);
    expect(state.lossLimitHit).toBe(false);
  });

  test('time at limit triggers time-limit-hit', () => {
    const state = computeLimitState(session({ timeLimitMinutes: 60 }), 0, NOW);
    expect(state.timeLimitHit).toBe(true);
  });

  test('time below limit does not trigger', () => {
    const state = computeLimitState(session({ timeLimitMinutes: 61 }), 0, NOW);
    expect(state.timeLimitHit).toBe(false);
  });

  test('endedAt freezes elapsedMinutes', () => {
    const ended = new Date('2026-05-15T10:30:00Z');
    const state = computeLimitState(
      session({ timeLimitMinutes: 25, endedAt: ended }),
      0,
      NOW
    );
    expect(state.elapsedMinutes).toBe(30);
    expect(state.timeLimitHit).toBe(true);
  });

  test('both limits hit independently', () => {
    const state = computeLimitState(
      session({ lossLimitCents: 1000, timeLimitMinutes: 30 }),
      -2000,
      NOW
    );
    expect(state.lossLimitHit).toBe(true);
    expect(state.timeLimitHit).toBe(true);
    expect(state.anyLimitHit).toBe(true);
  });
});
