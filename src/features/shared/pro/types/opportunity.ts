export type OpportunityCategory =
  | "real-estate"
  | "agriculture"
  | "energy"
  | "private-credit"
  | "other";

/**
 * Where the vault is, read from `get_state()`. `Funding` splits in two on the
 * deadline: `open` takes deposits, `closed` waits for Neko to close funding.
 */
export type OpportunityStatus =
  | "open"
  | "closed"
  | "funded"
  | "active"
  | "settled"
  | "failed";

export interface ProOpportunity {
  /** The Launchpad application id; also the `/pro/[id]` route segment. */
  id: string;
  name: string;
  description: string;
  category: OpportunityCategory;
  /** `null` until the vault has been read (or when the read failed). */
  status: OpportunityStatus | null;
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Annual target yield, in percent. */
  targetApy: number;
  termMonths: number;
  minInvestmentUsd: number;
  /** From vault `raised()`; `null` until read. */
  raisedUsd: number | null;
  targetUsd: number;
  minTargetUsd: number;
  /** ISO timestamp. */
  fundingDeadline: string;
  /** Token symbol the issuer chose at launch. */
  tokenSymbol: string;
  vault: string;
  token: string;
  /** 64 hex characters. */
  vaultId: string;
  /** Optional cover image; the card falls back to `gradient`. */
  imageSrc?: string;
  gradient: string;
}
