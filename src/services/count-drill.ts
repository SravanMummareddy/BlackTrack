// Hi-Lo running-count drill generator.
// Card values: 2-6 = +1, 7-9 = 0, 10/J/Q/K/A = -1.

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
type Rank = (typeof RANKS)[number];

const HI_LO: Record<Rank, number> = {
  '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
  '7': 0, '8': 0, '9': 0,
  '10': -1, J: -1, Q: -1, K: -1, A: -1,
};

export interface CountDrill {
  cards: Rank[];
  runningCount: number;
  decksRemaining: number;
  trueCount: number;
}

export function generateCountDrill(cardCount = 20, decksRemaining = 4): CountDrill {
  const cards: Rank[] = [];
  for (let i = 0; i < cardCount; i++) {
    cards.push(RANKS[Math.floor(Math.random() * RANKS.length)]);
  }
  const runningCount = cards.reduce((sum, c) => sum + HI_LO[c], 0);
  const trueCount = Math.round(runningCount / decksRemaining);
  return { cards, runningCount, decksRemaining, trueCount };
}

export function hiLoValue(card: Rank): number {
  return HI_LO[card];
}
