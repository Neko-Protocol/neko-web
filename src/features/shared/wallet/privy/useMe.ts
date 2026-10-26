"use client";

import { useQuery } from "@tanstack/react-query";
import {
  launchpadMeApi,
  type LaunchpadMeResponse,
} from "@/lib/services/launchpadMe.api";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { getPrivySession, PRIVY_WALLET_NAME } from "./privySession";
import { isAccountFunded } from "./privyFunding";

/** Excluded from the persisted cache in `app/providers.tsx`. */
export const ME_QUERY_ROOT = "me";

export const meQueryKey = (address: string | null) =>
  [ME_QUERY_ROOT, address] as const;

export const fundingQueryKey = (address: string | null) =>
  [ME_QUERY_ROOT, "funded", address] as const;

function usePrivyAddress() {
  const address = useStellarWalletStore((s) => s.address);
  const isPrivy = useStellarWalletStore(
    (s) => s.walletName === PRIVY_WALLET_NAME
  );
  return isPrivy ? address : null;
}

/** The Launchpad account (email, KYC) of the signed-in Privy user, if any. */
export function useMe() {
  const address = usePrivyAddress();

  return useQuery<LaunchpadMeResponse | null>({
    queryKey: meQueryKey(address),
    queryFn: () => launchpadMeApi.get(),
    // The bridge sets the session before the address, but a reload restores
    // the persisted address first.
    enabled: Boolean(address) && getPrivySession() !== null,
    staleTime: 60_000,
    retry: 1,
  });
}

/** Whether the Privy wallet exists on chain (friendbot ran). */
export function usePrivyFunding() {
  const address = usePrivyAddress();

  return useQuery({
    queryKey: fundingQueryKey(address),
    queryFn: () => isAccountFunded(address!),
    enabled: Boolean(address),
    staleTime: 60_000,
  });
}
