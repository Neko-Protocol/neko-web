"use client";

import { useQuery } from "@tanstack/react-query";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { useMe } from "@/features/shared/wallet/privy/useMe";
import { proAccessService } from "../services/proAccess.service";
import { proAccessKeys } from "./proAccessKeys";

/**
 * Whether the connected wallet is whitelisted for Neko Pro: a Pro investor
 * record, or a Privy login whose Launchpad account passed KYC/KYB.
 */
export function useProAccess() {
  const address = useStellarWalletStore((s) => s.address);
  const { data: me } = useMe();
  const launchpadVerified =
    me?.verification.status === "approved" && me.wallet.address === address;

  const investor = useQuery({
    queryKey: proAccessKeys.investor(address ?? null),
    queryFn: () => proAccessService.getInvestor(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60_000,
  });

  return {
    address: address ?? null,
    investor: investor.data ?? null,
    whitelisted: investor.data?.whitelisted === true || launchpadVerified,
    isLoading: investor.isPending && Boolean(address) && !launchpadVerified,
    isError: investor.isError,
    refetch: () => void investor.refetch(),
  };
}
