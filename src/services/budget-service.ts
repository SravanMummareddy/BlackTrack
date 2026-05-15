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

export interface BudgetSettingRow {
  id: string;
  userId: string;
  amountCents: number;
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function resolveEffectiveBudget(
  settings: BudgetSettingRow[],
  monthStart: Date
): BudgetSettingRow | null {
  let best: BudgetSettingRow | null = null;
  for (const s of settings) {
    if (s.effectiveFrom.getTime() <= monthStart.getTime()) {
      if (!best || s.effectiveFrom.getTime() > best.effectiveFrom.getTime()) best = s;
    }
  }
  return best;
}

import { prisma } from '../database';

export interface MonthlyBudgetView {
  month: string;
  budgetCents: number | null;
  effectiveFrom: string | null;
  netResultCents: number;
  lossUsedCents: number;
  percentUsed: number | null;
  state: BudgetState | null;
  daysLeftInMonth: number;
}

function formatMonth(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export async function getMonthlyBudgetView(
  userId: string,
  now: Date = new Date()
): Promise<MonthlyBudgetView> {
  const monthStart = monthStartUtc(now);
  const monthEnd = nextMonthStartUtc(monthStart);

  const [settings, sessions] = await Promise.all([
    prisma.budgetSetting.findMany({ where: { userId }, orderBy: { effectiveFrom: 'desc' } }),
    prisma.casinoSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        endedAt: { gte: monthStart, lt: monthEnd },
        cashOut: { not: null },
      },
      select: { buyIn: true, cashOut: true },
    }),
  ]);

  const effective = resolveEffectiveBudget(settings, monthStart);
  const netResultCents = sessions.reduce((sum, s) => sum + ((s.cashOut ?? 0) - s.buyIn), 0);
  const lossUsedCents = Math.max(0, -netResultCents);
  const percentUsed = computePercentUsed(lossUsedCents, effective?.amountCents ?? null);

  return {
    month: formatMonth(monthStart),
    budgetCents: effective?.amountCents ?? null,
    effectiveFrom: effective?.effectiveFrom.toISOString() ?? null,
    netResultCents,
    lossUsedCents,
    percentUsed,
    state: classifyState(percentUsed),
    daysLeftInMonth: daysLeftInMonth(now),
  };
}

export async function setBudget(
  userId: string,
  amountCents: number,
  effectiveFrom: Date
): Promise<BudgetSettingRow> {
  return prisma.budgetSetting.upsert({
    where: { userId_effectiveFrom: { userId, effectiveFrom } },
    update: { amountCents },
    create: { userId, amountCents, effectiveFrom },
  });
}

export async function listBudgetHistory(userId: string): Promise<BudgetSettingRow[]> {
  return prisma.budgetSetting.findMany({
    where: { userId },
    orderBy: { effectiveFrom: 'desc' },
  });
}
