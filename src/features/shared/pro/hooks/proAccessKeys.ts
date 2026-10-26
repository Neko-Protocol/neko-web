/**
 * Shared query keys.
 *
 * Also excluded from the persisted cache in `app/providers.tsx`: the KYC gate
 * must answer from the backend, not from last session's localStorage, and the
 * on-chain reads carry bigints that JSON cannot persist.
 */
export const PRO_ACCESS_QUERY_ROOT = "pro-access";

export const proAccessKeys = {
  all: [PRO_ACCESS_QUERY_ROOT] as const,
  investor: (wallet: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "investor", wallet] as const,
  verification: (id: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "verification", id] as const,
  opportunities: () => [PRO_ACCESS_QUERY_ROOT, "opportunities"] as const,
  opportunity: (id: string) =>
    [PRO_ACCESS_QUERY_ROOT, "opportunity", id] as const,
  vault: (vault: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "vault", vault] as const,
  milestones: (vaultId: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "milestones", vaultId] as const,
  usdcAccount: (wallet: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "usdc-account", wallet] as const,
  position: (vault: string, wallet: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "position", vault, wallet] as const,
};
