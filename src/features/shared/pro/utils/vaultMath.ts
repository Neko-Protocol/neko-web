import type { ProVault } from "../types/vault";

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/** Total return over the term, e.g. 0.13 for 13%. */
export function totalReturn(v: ProVault): number {
  return v.target > 0 ? v.expectedRepayment / v.target - 1 : 0;
}

/** Months from launch (or the funding deadline) to the last tranche. */
export function termMonths(v: ProVault): number {
  const last = v.tranches.at(-1)?.dueDate;
  const start = v.createdAt ?? v.fundingDeadline;
  if (!last || last <= start) return 0;
  return Math.max(1, Math.round((last - start) / MONTH_MS));
}

export function fundedPct(v: ProVault): number {
  return v.target > 0
    ? Math.min(100, Math.round((v.raised / v.target) * 100))
    : 0;
}

export function paidTranches(v: ProVault): number {
  return v.tranches.filter((t) => t.paidAt !== null).length;
}
