import type { ProOpportunity } from "../types/opportunity";

/**
 * Demo offerings until Launchpad publishes real ones. Issuers, figures and
 * tokens are illustrative — none of these exist on-chain yet. Photos are
 * from Unsplash (Unsplash License).
 */
export const PRO_OPPORTUNITIES: ProOpportunity[] = [
  {
    id: "andesCoffee",
    category: "agriculture",
    status: "open",
    country: "CO",
    targetApy: 11.5,
    termMonths: 12,
    payout: "at-maturity",
    minInvestmentUsd: 50,
    raisedUsd: 182_400,
    targetUsd: 250_000,
    tokenSymbol: "ANDES",
    imageSrc: "/pro/andes-coffee.jpg",
    gradient: "from-[#5B4A2E] via-[#2F2A1C] to-[#151512]",
  },
  {
    id: "lumenTower",
    category: "real-estate",
    status: "open",
    country: "MX",
    targetApy: 9.2,
    termMonths: 36,
    payout: "monthly",
    minInvestmentUsd: 100,
    raisedUsd: 640_000,
    targetUsd: 1_200_000,
    tokenSymbol: "LUMEN",
    imageSrc: "/pro/lumen-tower.jpg",
    gradient: "from-[#3E4A5C] via-[#232A33] to-[#121417]",
  },
  {
    id: "solarYucatan",
    category: "energy",
    status: "open",
    country: "MX",
    targetApy: 10.4,
    termMonths: 24,
    payout: "quarterly",
    minInvestmentUsd: 25,
    raisedUsd: 96_000,
    targetUsd: 400_000,
    tokenSymbol: "SOLY",
    imageSrc: "/pro/solar-yucatan.jpg",
    gradient: "from-[#6B5A1F] via-[#33301A] to-[#141410]",
  },
  {
    id: "invoicePyme",
    category: "private-credit",
    status: "coming-soon",
    country: "AR",
    targetApy: 14.0,
    termMonths: 6,
    payout: "at-maturity",
    minInvestmentUsd: 20,
    raisedUsd: 0,
    targetUsd: 150_000,
    tokenSymbol: "PYME",
    imageSrc: "/pro/pyme-invoices.jpg",
    gradient: "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
  },
];

export function getProOpportunity(id: string): ProOpportunity | undefined {
  return PRO_OPPORTUNITIES.find((o) => o.id === id);
}

/** Share of the current raise reached at the end of each of the last 8 weeks. */
const FUNDING_CURVE = [0.08, 0.19, 0.31, 0.44, 0.52, 0.67, 0.83, 1];
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Illustrative weekly funding history ending at today's raise. Demo-only, like
 * the offerings themselves; replace with indexed deposits once tokens are
 * live.
 */
export function getFundingHistory(
  opportunity: ProOpportunity,
  now = Date.now()
): { timestamp: number; raisedUsd: number }[] {
  if (opportunity.raisedUsd <= 0) return [];
  const last = FUNDING_CURVE.length - 1;
  return FUNDING_CURVE.map((share, i) => ({
    timestamp: now - (last - i) * WEEK_MS,
    raisedUsd: Math.round(opportunity.raisedUsd * share),
  }));
}
