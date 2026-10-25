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
    minInvestmentUsd: 20,
    raisedUsd: 0,
    targetUsd: 150_000,
    tokenSymbol: "PYME",
    imageSrc: "/pro/pyme-invoices.jpg",
    gradient: "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
  },
];
