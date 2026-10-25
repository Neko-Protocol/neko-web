"use client";

import { useQuery } from "@tanstack/react-query";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { proAccessService } from "../services/proAccess.service";
import { proAccessKeys } from "./proAccessKeys";

/** Whether the connected wallet is whitelisted for Neko Pro. */
export function useProAccess() {
  const address = useStellarWalletStore((s) => s.address);

  const investor = useQuery({
    queryKey: proAccessKeys.investor(address ?? null),
    queryFn: () => proAccessService.getInvestor(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60_000,
  });

  return {
    address: address ?? null,
    investor: investor.data ?? null,
    whitelisted: investor.data?.whitelisted === true,
    isLoading: investor.isPending && Boolean(address),
    isError: investor.isError,
    refetch: () => void investor.refetch(),
  };
}
