export type VaultCategory =
  "real-estate" | "agriculture" | "energy" | "private-credit";

/** Mirrors the vault contract's `VaultState`. */
export type VaultState = "Funding" | "Funded" | "Active" | "Settled" | "Failed";

/** The classic asset a vault is denominated in, and its Stellar Asset Contract. */
export interface VaultAsset {
  code: string;
  issuer: string;
  contract: string;
}

/** One deployed vault, as recorded in the tokenization repo's deployments. */
export interface VaultDeployment {
  /** Route segment and i18n key under `sharedPro.vaults`. */
  slug: string;
  vaultId: string;
  vault: string;
  token: string;
  compliance: string;
  borrower: string;
  asset: VaultAsset;
}

/** Off-chain presentation the contracts don't carry. */
export interface VaultPresentation {
  category: VaultCategory;
  imageSrc?: string;
  gradient: string;
}

export interface VaultTranche {
  index: number;
  /** Whole units of the vault's asset. */
  expected: number;
  paid: number;
  /** ms since epoch. */
  dueDate: number;
  /** ms since epoch, or null while unpaid. */
  paidAt: number | null;
  evidenceUri: string;
}

/** A vault read live from the chain, amounts in whole units of its asset. */
export interface ProVault extends VaultDeployment, VaultPresentation {
  name: string;
  symbol: string;
  state: VaultState;
  target: number;
  minTarget: number;
  raised: number;
  repaid: number;
  expectedRepayment: number;
  /** ms since epoch. */
  fundingDeadline: number;
  exitFeeBps: number;
  maxExitFeeBps: number;
  tranches: VaultTranche[];
  /** ms since epoch; from the factory's deployment record. */
  createdAt: number | null;
}
