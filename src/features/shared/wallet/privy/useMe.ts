"use client";

import { useQuery } from "@tanstack/react-query";
import { meApi, type MeResponse } from "@/lib/services/me.api";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { PRIVY_WALLET_NAME } from "./privySession";

export const ME_QUERY_ROOT = "me";

export const meQueryKey = (address: string | null) =>
  [ME_QUERY_ROOT, address] as const;

export function useMe() {
  const address = useStellarWalletStore((s) => s.address);
  const isPrivy = useStellarWalletStore(
    (s) => s.walletName === PRIVY_WALLET_NAME
  );

  return useQuery<MeResponse>({
    queryKey: meQueryKey(address),
    queryFn: () => meApi.get(),
    enabled: isPrivy && Boolean(address),
    staleTime: 60_000,
    retry: 1,
  });
}
