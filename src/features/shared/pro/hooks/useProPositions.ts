"use client";

import { useQueries } from "@tanstack/react-query";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import {
  readVaultPosition,
  type VaultPosition,
} from "../services/proChain.service";
import type { ProOpportunity } from "../types/opportunity";
import { proAccessKeys } from "./proAccessKeys";

export interface ProPosition {
  opportunity: ProOpportunity;
  position: VaultPosition;
}

export function positionQuery(opportunity: ProOpportunity, wallet: string) {
  return {
    queryKey: proAccessKeys.position(opportunity.vault, wallet),
    queryFn: () =>
      readVaultPosition(opportunity.vault, opportunity.token, wallet),
    staleTime: 15_000,
  };
}

/**
 * The connected wallet's holdings across the listed vaults: token balance,
 * `claimable` and `exit_value`, read per vault. Only vaults the wallet holds
 * tokens in are returned.
 */
export function useProPositions(opportunities: ProOpportunity[]) {
  const wallet = useStellarWalletStore((s) => s.address);

  return useQueries({
    queries: wallet
      ? opportunities.map((opportunity) => positionQuery(opportunity, wallet))
      : [],
    combine: (results) => ({
      positions: results.flatMap((result, i): ProPosition[] =>
        result.data && result.data.balance > 0n
          ? [{ opportunity: opportunities[i], position: result.data }]
          : []
      ),
      isLoading: results.some((result) => result.isPending),
    }),
  });
}
