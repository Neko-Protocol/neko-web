"use client";

import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { PRIVY_WALLET_NAME } from "@/features/shared/wallet/privy/privySession";

export function useHasWalletPrompt(): boolean {
  return useStellarWalletStore((s) => s.walletName !== PRIVY_WALLET_NAME);
}
