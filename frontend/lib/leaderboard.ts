
export const PAYOUTS_BY_RANK: Record<number, number> = {
  1: 80,
  2: 40,
  3: 40,
  4: 20,
  5: 20,
  6: 20,
  7: 20,
  8: 20,
  9: 20,
  10: 20,
};

export const TOP_PAID_RANK = Math.max(
  ...Object.keys(PAYOUTS_BY_RANK).map(Number)
);

export const TOTAL_WEEKLY_PRIZE_POOL = Object.values(PAYOUTS_BY_RANK).reduce(
  (a, b) => a + b,
  0
); 

export const PERIOD_DAYS = 7;