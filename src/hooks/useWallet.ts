"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchBalances,
  signStellarTransactionWithWallet,
  type MappedBalances,
} from "@/lib/helpers/stellar/wallet";
import { stellarNetwork, networkPassphrase } from "@/lib/constants/network";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import {
  PRIVY_WALLET_NAME,
  requirePrivySession,
} from "@/features/shared/wallet/privy/privySession";

export function useWallet() {
  const { address: stellarAddress, walletName } = useStellarWalletStore();
  const address = stellarAddress ?? undefined;
  const isPrivyWallet = walletName === PRIVY_WALLET_NAME;

  const {
    data: {
      balances = {} as MappedBalances,
      subentryCount = 0,
      nativeBalanceStroops = 0n,
    } = {},
    isFetching: isFetchingBalances,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: ["balances", address],
    queryFn: () => fetchBalances(address!),
    enabled: Boolean(address),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1,
  });

  const signTransaction = async (
    xdr: string,
    options?: { networkPassphrase?: string; address?: string }
  ) => {
    if (!address) {
      throw new Error("Connect Stellar wallet to sign");
    }
    const signerPublicKey = options?.address ?? address;
    if (isPrivyWallet) {
      const signedTxXdr = await requirePrivySession().wallet.signTransaction(
        xdr,
        { networkPassphrase: options?.networkPassphrase ?? networkPassphrase }
      );
      return { signedTxXdr };
    }
    const signedTxXdr = await signStellarTransactionWithWallet({
      unsignedTransactionXdr: xdr,
      signerPublicKey,
      networkPassphrase: options?.networkPassphrase,
    });
    return { signedTxXdr };
  };

  return {
    address: address ?? undefined,
    isPrivyWallet,
    network: stellarNetwork,
    networkPassphrase,
    balances,
    subentryCount,
    nativeBalanceStroops,
    isFetchingBalances,
    isPending: false,
    refetchBalances: async () => {
      await refetchBalances();
    },
    signTransaction,
  };
}
