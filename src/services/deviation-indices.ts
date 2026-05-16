import type { StrategyAction } from '@prisma/client';

// Illustrious 18: highest-value strategy deviations from basic
// strategy keyed by true count. `defaultAction` is the basic-strategy
// play; `deviation` is the alternate play when the comparator is met.
// `compare` semantics:
//   - 'gte': deviate when trueCount >= threshold
//   - 'lte': deviate when trueCount <= threshold

export type CompareOp = 'gte' | 'lte';

export interface DeviationIndex {
  id: string;
  label: string;
  hand: string;
  dealerUpcard: string;
  threshold: number;
  compare: CompareOp;
  defaultAction: StrategyAction;
  deviation: StrategyAction;
}

export const ILLUSTRIOUS_18: DeviationIndex[] = [
  { id: 'insurance', label: 'Insurance',         hand: 'any',     dealerUpcard: 'A',  threshold: 3,  compare: 'gte', defaultAction: 'HIT',    deviation: 'HIT' },
  { id: '16v10',     label: '16 vs 10',          hand: 'hard 16', dealerUpcard: '10', threshold: 0,  compare: 'gte', defaultAction: 'HIT',    deviation: 'STAND' },
  { id: '15v10',     label: '15 vs 10',          hand: 'hard 15', dealerUpcard: '10', threshold: 4,  compare: 'gte', defaultAction: 'HIT',    deviation: 'STAND' },
  { id: 'pp10v5',    label: '10,10 vs 5',        hand: 'pair 10', dealerUpcard: '5',  threshold: 5,  compare: 'gte', defaultAction: 'STAND',  deviation: 'SPLIT' },
  { id: 'pp10v6',    label: '10,10 vs 6',        hand: 'pair 10', dealerUpcard: '6',  threshold: 4,  compare: 'gte', defaultAction: 'STAND',  deviation: 'SPLIT' },
  { id: '10vA',      label: '10 vs A',           hand: 'hard 10', dealerUpcard: 'A',  threshold: 4,  compare: 'gte', defaultAction: 'HIT',    deviation: 'DOUBLE' },
  { id: '12v3',      label: '12 vs 3',           hand: 'hard 12', dealerUpcard: '3',  threshold: 2,  compare: 'gte', defaultAction: 'HIT',    deviation: 'STAND' },
  { id: '12v2',      label: '12 vs 2',           hand: 'hard 12', dealerUpcard: '2',  threshold: 3,  compare: 'gte', defaultAction: 'HIT',    deviation: 'STAND' },
  { id: '11vA',      label: '11 vs A',           hand: 'hard 11', dealerUpcard: 'A',  threshold: 1,  compare: 'gte', defaultAction: 'HIT',    deviation: 'DOUBLE' },
  { id: '9v2',       label: '9 vs 2',            hand: 'hard 9',  dealerUpcard: '2',  threshold: 1,  compare: 'gte', defaultAction: 'HIT',    deviation: 'DOUBLE' },
  { id: '10v10',     label: '10 vs 10',          hand: 'hard 10', dealerUpcard: '10', threshold: 4,  compare: 'gte', defaultAction: 'HIT',    deviation: 'DOUBLE' },
  { id: '9v7',       label: '9 vs 7',            hand: 'hard 9',  dealerUpcard: '7',  threshold: 3,  compare: 'gte', defaultAction: 'HIT',    deviation: 'DOUBLE' },
  { id: '16v9',      label: '16 vs 9',           hand: 'hard 16', dealerUpcard: '9',  threshold: 5,  compare: 'gte', defaultAction: 'HIT',    deviation: 'STAND' },
  { id: '13v2',      label: '13 vs 2',           hand: 'hard 13', dealerUpcard: '2',  threshold: -1, compare: 'lte', defaultAction: 'STAND',  deviation: 'HIT' },
  { id: '12v4',      label: '12 vs 4',           hand: 'hard 12', dealerUpcard: '4',  threshold: 0,  compare: 'lte', defaultAction: 'STAND',  deviation: 'HIT' },
  { id: '12v5',      label: '12 vs 5',           hand: 'hard 12', dealerUpcard: '5',  threshold: -2, compare: 'lte', defaultAction: 'STAND',  deviation: 'HIT' },
  { id: '12v6',      label: '12 vs 6',           hand: 'hard 12', dealerUpcard: '6',  threshold: -1, compare: 'lte', defaultAction: 'STAND',  deviation: 'HIT' },
  { id: '13v3',      label: '13 vs 3',           hand: 'hard 13', dealerUpcard: '3',  threshold: -2, compare: 'lte', defaultAction: 'STAND',  deviation: 'HIT' },
];

export function correctActionForIndex(index: DeviationIndex, trueCount: number): StrategyAction {
  const deviate = index.compare === 'gte' ? trueCount >= index.threshold : trueCount <= index.threshold;
  return deviate ? index.deviation : index.defaultAction;
}
