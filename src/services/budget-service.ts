export type BudgetState = 'ok' | 'caution' | 'over';

export function monthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

export function nextMonthStartUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

export function daysLeftInMonth(now: Date): number {
  const end = nextMonthStartUtc(now);
  const startOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const ms = end.getTime() - startOfToday.getTime();
  return Math.max(1, Math.round(ms / (24 * 60 * 60 * 1000)));
}

export function computePercentUsed(
  lossUsedCents: number,
  budgetCents: number | null
): number | null {
  if (budgetCents === null || budgetCents <= 0) return null;
  return Math.round((lossUsedCents / budgetCents) * 100);
}

export function classifyState(percentUsed: number | null): BudgetState | null {
  if (percentUsed === null) return null;
  if (percentUsed >= 100) return 'over';
  if (percentUsed >= 75) return 'caution';
  return 'ok';
}
