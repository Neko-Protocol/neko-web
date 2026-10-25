export type OpportunityCategory =
  "real-estate" | "agriculture" | "energy" | "private-credit";

export type OpportunityStatus = "open" | "coming-soon";

export type PayoutFrequency = "monthly" | "quarterly" | "at-maturity";

export interface ProOpportunity {
  /** Also the i18n key under `sharedPro.opportunities`. */
  id: string;
  category: OpportunityCategory;
  status: OpportunityStatus;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Annual target yield, in percent. */
  targetApy: number;
  termMonths: number;
  payout: PayoutFrequency;
  minInvestmentUsd: number;
  raisedUsd: number;
  targetUsd: number;
  /** Token symbol the issuer receives on Launchpad. */
  tokenSymbol: string;
  /** Optional cover image; the card falls back to `gradient`. */
  imageSrc?: string;
  gradient: string;
}
