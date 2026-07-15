
export const PAYOUTS_BY_RANK: Record<number, number> = {
  1: 500,
  2: 350,
  3: 250,
  4: 200,
  5: 200,
  6: 200,
  7: 200,
  8: 200,
  9: 200,
  10: 200,
};

export const TOP_PAID_RANK = Math.max(
  ...Object.keys(PAYOUTS_BY_RANK).map(Number)
);

export const TOTAL_WEEKLY_PRIZE_POOL = Object.values(PAYOUTS_BY_RANK).reduce(
  (a, b) => a + b,
  0
);

export const PERIOD_DAYS = 7;