/**
 * Shared query keys.
 *
 * Also excluded from the persisted cache in `app/providers.tsx`: the KYC gate
 * must answer from the backend, not from last session's localStorage.
 */
export const PRO_ACCESS_QUERY_ROOT = "pro-access";

export const proAccessKeys = {
  all: [PRO_ACCESS_QUERY_ROOT] as const,
  investor: (wallet: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "investor", wallet] as const,
  verification: (id: string | null) =>
    [PRO_ACCESS_QUERY_ROOT, "verification", id] as const,
};
