import { prisma } from '../database';
import { NotFoundError } from '../utils/errors';
import type {
  StrategyAction,
  StrategyAttempt,
  StrategyScenario,
} from '@prisma/client';

type StrategyTable = Record<string, readonly StrategyAction[]>;

const HARD_TABLE: StrategyTable = {
  '21': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '20': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '19': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '18': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '17': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '16': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '15': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '14': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '13': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '12': ['HIT', 'HIT', 'STAND', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '11': ['DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT'],
  '10': ['DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT'],
  '9': ['HIT', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '8': ['HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '7': ['HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '6': ['HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '5': ['HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
};

const SOFT_TABLE: StrategyTable = {
  '9': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '8': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '7': ['STAND', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'STAND', 'STAND', 'HIT', 'HIT', 'HIT'],
  '6': ['HIT', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '5': ['HIT', 'HIT', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '4': ['HIT', 'HIT', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '3': ['HIT', 'HIT', 'HIT', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '2': ['HIT', 'HIT', 'HIT', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
};

const PAIR_TABLE: StrategyTable = {
  A: ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT'],
  '10': ['STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND', 'STAND'],
  '9': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'STAND', 'SPLIT', 'SPLIT', 'STAND', 'STAND'],
  '8': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT'],
  '7': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '6': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '5': ['DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'DOUBLE', 'HIT', 'HIT'],
  '4': ['HIT', 'HIT', 'HIT', 'SPLIT', 'SPLIT', 'HIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '3': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'HIT', 'HIT', 'HIT', 'HIT'],
  '2': ['SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'SPLIT', 'HIT', 'HIT', 'HIT', 'HIT'],
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

export interface StrategyEvaluation {
  action: StrategyAction;
  correct: boolean;
  correctAction: StrategyAction;
  reasoning: string;
  ruleOfThumb: string;
}

export interface StrategyAttemptResult {
  attempt: StrategyAttempt;
  evaluation: StrategyEvaluation;
}

export interface StrategyProgress {
  attempts: number;
  correct: number;
  accuracy: number | null;
  averageResponseTimeMs: number | null;
  lastAttemptAt: Date | null;
}

export interface ScenarioFilters {
  difficulty?: number;
  isSoft?: boolean;
  isPair?: boolean;
}

export function evaluateScenario(
  scenario: Pick<StrategyScenario, 'playerCards' | 'dealerUpcard' | 'playerTotal' | 'isSoft' | 'isPair' | 'correctAction'>,
  action: StrategyAction
): StrategyEvaluation {
  return {
    action,
    correct: action === scenario.correctAction,
    correctAction: scenario.correctAction,
    reasoning: buildReasoning(scenario, scenario.correctAction),
    ruleOfThumb: buildRuleOfThumb(scenario, scenario.correctAction),
  };
}

export function buildScenarioSeedData(): Array<Omit<StrategyScenario, 'id' | 'createdAt'>> {
  const scenarios: Array<Omit<StrategyScenario, 'id' | 'createdAt'>> = [];

  for (const [total, actions] of Object.entries(HARD_TABLE)) {
    DEALER_UPCARDS.forEach((dealerUpcard, index) => {
      scenarios.push({
        playerCards: buildHardCards(Number(total)),
        dealerUpcard,
        playerTotal: Number(total),
        isSoft: false,
        isPair: false,
        correctAction: actions[index],
        difficulty: getDifficulty(Number(total), false, false),
      });
    });
  }

  for (const [otherCard, actions] of Object.entries(SOFT_TABLE)) {
    DEALER_UPCARDS.forEach((dealerUpcard, index) => {
      const total = 11 + Number(otherCard);
      scenarios.push({
        playerCards: ['A', otherCard],
        dealerUpcard,
        playerTotal: total,
        isSoft: true,
        isPair: false,
        correctAction: actions[index],
        difficulty: getDifficulty(total, true, false),
      });
    });
  }

  for (const [pairCard, actions] of Object.entries(PAIR_TABLE)) {
    DEALER_UPCARDS.forEach((dealerUpcard, index) => {
      const normalized = pairCard === 'A' ? 'A' : pairCard;
      const total = normalized === 'A' ? 12 : cardValue(normalized) * 2;
      scenarios.push({
        playerCards: [normalized, normalized],
        dealerUpcard,
        playerTotal: total,
        isSoft: normalized === 'A',
        isPair: true,
        correctAction: actions[index],
        difficulty: getDifficulty(total, normalized === 'A', true),
      });
    });
  }

  return scenarios;
}

export async function getRandomScenario(
  filters: ScenarioFilters = {}
): Promise<StrategyScenario> {
  const scenarios = await prisma.strategyScenario.findMany({
    where: {
      ...(filters.difficulty !== undefined && { difficulty: filters.difficulty }),
      ...(filters.isSoft !== undefined && { isSoft: filters.isSoft }),
      ...(filters.isPair !== undefined && { isPair: filters.isPair }),
    },
    orderBy: { createdAt: 'asc' },
  });

  if (scenarios.length === 0) {
    throw new NotFoundError('Strategy scenario');
  }

  const index = Math.floor(Math.random() * scenarios.length);
  return scenarios[index];
}

export async function submitAttempt(
  userId: string,
  scenarioId: string,
  action: StrategyAction,
  timeMs?: number
): Promise<StrategyAttemptResult> {
  const scenario = await prisma.strategyScenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) {
    throw new NotFoundError('Strategy scenario');
  }

  const evaluation = evaluateScenario(scenario, action);

  const attempt = await prisma.strategyAttempt.create({
    data: {
      userId,
      scenarioId,
      action,
      correct: evaluation.correct,
      timeMs,
    },
  });

  return { attempt, evaluation };
}

export async function getUserProgress(userId: string): Promise<StrategyProgress> {
  const [aggregate, latest] = await Promise.all([
    prisma.strategyAttempt.aggregate({
      where: { userId },
      _count: { _all: true },
      _avg: { timeMs: true },
    }),
    prisma.strategyAttempt.findFirst({
      where: { userId },
      orderBy: { attemptedAt: 'desc' },
    }),
  ]);

  const correct = await prisma.strategyAttempt.count({
    where: { userId, correct: true },
  });

  const attempts = aggregate._count._all;

  return {
    attempts,
    correct,
    accuracy: attempts > 0 ? correct / attempts : null,
    averageResponseTimeMs: aggregate._avg.timeMs === null ? null : Math.round(aggregate._avg.timeMs),
    lastAttemptAt: latest?.attemptedAt ?? null,
  };
}

function buildHardCards(total: number): string[] {
  if (total >= 13 && total <= 18) {
    return ['10', String(total - 10)];
  }
  if (total === 19 || total === 20) {
    return ['10', total === 20 ? '10' : '9'];
  }
  if (total === 21) {
    return ['10', 'A'];
  }
  if (total === 12) return ['10', '2'];
  if (total === 11) return ['6', '5'];
  if (total === 10) return ['6', '4'];
  if (total === 9) return ['5', '4'];
  if (total === 8) return ['5', '3'];
  if (total === 7) return ['4', '3'];
  return ['4', '2'];
}

function getDifficulty(total: number, isSoft: boolean, isPair: boolean): number {
  if (isPair) return 3;
  if (isSoft) return total >= 18 ? 2 : 3;
  if (total >= 17 || total <= 8) return 1;
  if (total >= 12 && total <= 16) return 3;
  return 2;
}

function cardValue(rank: string): number {
  if (rank === 'A') return 11;
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  return Number(rank);
}

function buildReasoning(
  scenario: Pick<StrategyScenario, 'playerCards' | 'dealerUpcard' | 'playerTotal' | 'isSoft' | 'isPair'>,
  action: StrategyAction
): string {
  const handLabel = getHandLabel(scenario);
  const upcard = scenario.dealerUpcard === 'A' ? 'Ace' : scenario.dealerUpcard;

  if (action === 'HIT') {
    return `Your ${handLabel.toLowerCase()} is behind a dealer ${upcard}, so taking another card improves the long-run result.`;
  }
  if (action === 'STAND') {
    return `Against a dealer ${upcard}, your ${handLabel.toLowerCase()} is strong enough to stand and let the dealer draw.`;
  }
  if (action === 'DOUBLE') {
    return `This is a profitable double spot: your ${handLabel.toLowerCase()} has enough equity to press the advantage.`;
  }
  if (action === 'SPLIT') {
    return `Splitting ${scenario.playerCards[0]}-${scenario.playerCards[1]} creates stronger starting hands than playing the pair as one total.`;
  }
  return `Surrender trims a bad spot by saving half your bet when the dealer ${upcard} has a strong edge.`;
}

function buildRuleOfThumb(
  scenario: Pick<StrategyScenario, 'playerTotal' | 'isSoft' | 'isPair' | 'playerCards'>,
  action: StrategyAction
): string {
  if (action === 'DOUBLE') {
    return scenario.isSoft
      ? 'Soft 13-18 often doubles against weak dealer upcards.'
      : 'Hard 10 or 11 is often a double when the dealer is vulnerable.';
  }
  if (action === 'SPLIT') {
    return 'Always split Aces and 8s. Never split 5s or 10s.';
  }
  if (action === 'STAND' && !scenario.isSoft && scenario.playerTotal >= 12 && scenario.playerTotal <= 16) {
    return 'Hard 12-16 vs dealer 2-6 usually stands and lets the dealer bust.';
  }
  if (action === 'HIT' && scenario.playerTotal <= 11) {
    return "You can't bust by hitting 11 or less.";
  }
  return 'Basic strategy minimizes house edge over the long run.';
}

function getHandLabel(
  scenario: Pick<StrategyScenario, 'playerCards' | 'playerTotal' | 'isSoft' | 'isPair'>
): string {
  if (scenario.isPair) {
    return `Pair of ${scenario.playerCards[0]}s`;
  }
  if (scenario.isSoft) {
    return `Soft ${scenario.playerTotal}`;
  }
  return `Hard ${scenario.playerTotal}`;
}
