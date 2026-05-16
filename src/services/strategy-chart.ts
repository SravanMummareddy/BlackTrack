import type { StrategyAction } from '@prisma/client';

// Canonical basic-strategy chart: multi-deck, dealer stands soft 17,
// DAS allowed, no surrender. Cells are dealer upcards 2..10,A.

type Row = readonly StrategyAction[];

const H: StrategyAction = 'HIT';
const S: StrategyAction = 'STAND';
const D: StrategyAction = 'DOUBLE';
const P: StrategyAction = 'SPLIT';

export const HARD: Record<string, Row> = {
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
export const SOFT: Record<string, Row> = {
  '9': [S, S, S, S, S, S, S, S, S, S],
  '8': [S, S, S, S, S, S, S, S, S, S],
  '7': [S, D, D, D, D, S, S, H, H, H],
  '6': [H, D, D, D, D, H, H, H, H, H],
  '5': [H, H, D, D, D, H, H, H, H, H],
  '4': [H, H, D, D, D, H, H, H, H, H],
  '3': [H, H, H, D, D, H, H, H, H, H],
  '2': [H, H, H, D, D, H, H, H, H, H],
};

export const PAIR: Record<string, Row> = {
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

export const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

// Compact 1-letter codes for client rendering.
const CODE: Record<StrategyAction, string> = {
  HIT: 'H',
  STAND: 'S',
  DOUBLE: 'D',
  SPLIT: 'P',
  SURRENDER: 'R',
};

function encode(table: Record<string, Row>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [key, row] of Object.entries(table)) {
    out[key] = row.map((a) => CODE[a]);
  }
  return out;
}

export interface ReferenceChart {
  dealerUpcards: readonly string[];
  hard: Record<string, string[]>;
  soft: Record<string, string[]>;
  pair: Record<string, string[]>;
}

export function getReferenceChart(): ReferenceChart {
  return {
    dealerUpcards: DEALER_UPCARDS,
    hard: encode(HARD),
    soft: encode(SOFT),
    pair: encode(PAIR),
  };
}
