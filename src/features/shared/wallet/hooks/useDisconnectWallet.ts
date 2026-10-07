"use client";

import { useCallback } from "react";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import {
  getPrivySession,
  isPrivyWalletActive,
} from "@/features/shared/wallet/privy/privySession";

export function useDisconnectWallet() {
  const { disconnect } = useStellarWallet();

  return useCallback(async () => {
    if (isPrivyWalletActive()) {
      useStellarWalletStore.getState().clearWallet();
      try {
        await getPrivySession()?.logout();
      } catch {}
      return;
    }
    await disconnect();
  }, [disconnect]);
}
