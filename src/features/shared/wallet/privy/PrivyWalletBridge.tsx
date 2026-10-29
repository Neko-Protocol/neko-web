"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivy, type User } from "@privy-io/react-auth";
import {
  useCreateWallet,
  useSignRawHash,
} from "@privy-io/react-auth/extended-chains";
import { createRawHashWallet } from "@neko-protocol/wallet-core";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { useToast } from "@/hooks/useToast";
import { meApi } from "@/lib/services/me.api";
import { PRIVY_WALLET_NAME, setPrivySession } from "./privySession";
import { meQueryKey } from "./useMe";

function findStellarWallet(user: User): string | null {
  for (const account of user.linkedAccounts) {
    if (
      account.type === "wallet" &&
      account.chainType === "stellar" &&
      (account.walletClientType === "privy" ||
        account.walletClientType === "privy-v2")
    ) {
      return account.address;
    }
  }
  return null;
}

export function PrivyWalletBridge() {
  const t = useTranslations("common.wallet");
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const setWallet = useStellarWalletStore((s) => s.setWallet);
  const clearWallet = useStellarWalletStore((s) => s.clearWallet);
  const queryClient = useQueryClient();
  const { addNotification } = useToast();

  const signRawHashRef = useRef(signRawHash);
  const getAccessTokenRef = useRef(getAccessToken);
  const logoutRef = useRef(logout);
  useEffect(() => {
    signRawHashRef.current = signRawHash;
    getAccessTokenRef.current = getAccessToken;
    logoutRef.current = logout;
  });

  const syncedUserId = useRef<string | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!ready) return;

    if (!authenticated || !user) {
      syncedUserId.current = null;
      setPrivySession(null);
      if (useStellarWalletStore.getState().walletName === PRIVY_WALLET_NAME) {
        clearWallet();
      }
      return;
    }

    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    void (async () => {
      try {
        const address =
          findStellarWallet(user) ??
          (await createWallet({ chainType: "stellar" })).wallet.address;

        setPrivySession({
          wallet: createRawHashWallet({
            address,
            provider: "privy",
            signRawHash: async (hash) =>
              (
                await signRawHashRef.current({
                  address,
                  chainType: "stellar",
                  hash,
                })
              ).signature,
          }),
          getAccessToken: () => getAccessTokenRef.current(),
          logout: () => logoutRef.current(),
        });

        setWallet({ address, walletName: PRIVY_WALLET_NAME });

        const me = await meApi.bootstrap();
        queryClient.setQueryData(meQueryKey(address), me);
      } catch (err) {
        syncedUserId.current = null;
        console.error("privy_bootstrap_failed", err);
        addNotification(t("privySetupFailedTitle"), "error", {
          description: t("privySetupFailedDescription"),
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, userId]);

  return null;
}
