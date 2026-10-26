"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import { PRO_NETWORK } from "../constants/deployments";
import { opportunitiesService } from "../services/opportunities.service";
import {
  invest,
  VaultActionError,
  withdraw,
  withdrawValue,
} from "../services/vaultActions";
import { readBalance, readVault } from "../services/vaultReader";
import type { ProVault } from "../types/vault";

const proKeys = {
  vaults: ["pro", "vaults"] as const,
  vault: (id: string) => ["pro", "vault", id] as const,
  balance: (token: string, address: string | undefined) =>
    ["pro", "balance", token, address] as const,
};

const LIVE = { staleTime: 30_000, refetchInterval: 60_000 } as const;

/** Every live vault the backend lists, read live from the chain. */
export function useProVaults() {
  return useQuery({
    queryKey: proKeys.vaults,
    queryFn: async () =>
      Promise.all((await opportunitiesService.list()).map(readVault)),
    ...LIVE,
  });
}

/** `null` when there is no live vault with that id. */
export function useProVault(id: string) {
  return useQuery({
    queryKey: proKeys.vault(id),
    queryFn: async () => {
      const deployment = await opportunitiesService.get(id);
      return deployment ? readVault(deployment) : null;
    },
    ...LIVE,
  });
}

/** A token balance on the Pro network for the connected wallet. */
export function useProBalance(token: string, address: string | undefined) {
  return useQuery({
    queryKey: proKeys.balance(token, address),
    queryFn: () => readBalance(token, address!),
    enabled: Boolean(address),
    ...LIVE,
  });
}

/** USDC the connected wallet would get by withdrawing now. */
export function useWithdrawValue(
  vault: ProVault,
  address: string | undefined,
  position: number
) {
  return useQuery({
    queryKey: [
      "pro",
      "withdraw-value",
      vault.id,
      vault.state,
      address,
      position,
    ],
    queryFn: () => withdrawValue(vault, address!, position),
    enabled: Boolean(address) && position > 0,
    staleTime: 15_000,
  });
}

/** Invest or withdraw, then refresh the vault and the wallet's balances. */
export function useVaultAction(vault: ProVault) {
  const queryClient = useQueryClient();
  const { address, signTransaction } = useWallet();
  const sign = async (xdr: string) =>
    (
      await signTransaction(xdr, {
        networkPassphrase: PRO_NETWORK.networkPassphrase,
      })
    ).signedTxXdr;

  return useMutation({
    mutationFn: (
      action: { kind: "invest"; amount: number } | { kind: "withdraw" }
    ) => {
      if (!address) throw new VaultActionError("noWallet");
      return action.kind === "invest"
        ? invest(vault, address, action.amount, sign)
        : withdraw(vault, address, sign);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["pro"] }),
  });
}
