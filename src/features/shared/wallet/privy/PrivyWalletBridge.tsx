"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { usePrivy, type User } from "@privy-io/react-auth";
import {
  useCreateWallet,
  useSignRawHash,
} from "@privy-io/react-auth/extended-chains";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { useToast } from "@/hooks/useToast";
import { launchpadMeApi } from "@/lib/services/launchpadMe.api";
import { PRIVY_WALLET_NAME, setPrivySession } from "./privySession";
import { createRawHashWallet } from "./rawHashWallet";
import { usePrivyUserStore } from "./privyUser.store";
import { ensurePrivyWalletFunded } from "./privyFunding";
import { fundingQueryKey, meQueryKey } from "./useMe";

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

function findEmail(user: User): string | null {
  return user.email?.address ?? user.google?.email ?? null;
}

/**
 * Mirrors the Privy login into the shared wallet store: finds (or creates)
 * the user's embedded Stellar wallet, funds it with friendbot on testnet and
 * loads the Launchpad account behind the login, if there is one.
 */
export function PrivyWalletBridge() {
  const t = useTranslations("common.wallet");
  const { ready, authenticated, user, getAccessToken, logout } = usePrivy();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const setWallet = useStellarWalletStore((s) => s.setWallet);
  const clearWallet = useStellarWalletStore((s) => s.clearWallet);
  const setEmail = usePrivyUserStore((s) => s.setEmail);
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
      setEmail(null);
      if (useStellarWalletStore.getState().walletName === PRIVY_WALLET_NAME) {
        clearWallet();
      }
      return;
    }

    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;

    void (async () => {
      let address: string;
      try {
        address =
          findStellarWallet(user) ??
          (await createWallet({ chainType: "stellar" })).wallet.address;

        setPrivySession({
          wallet: createRawHashWallet({
            address,
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

        setEmail(findEmail(user));
        setWallet({ address, walletName: PRIVY_WALLET_NAME });
      } catch (err) {
        syncedUserId.current = null;
        console.error("privy_wallet_setup_failed", err);
        addNotification(t("privySetupFailedTitle"), "error", {
          description: t("privySetupFailedDescription"),
        });
        return;
      }

      // Neither step blocks the session: Settings retries the funding and
      // `useMe` refetches the account.
      void queryClient
        .fetchQuery({
          queryKey: meQueryKey(address),
          queryFn: () => launchpadMeApi.get(),
        })
        .catch((err) => console.error("privy_me_failed", err));

      try {
        const funded = await ensurePrivyWalletFunded(address);
        queryClient.setQueryData(fundingQueryKey(address), funded);
        if (funded) {
          await queryClient.invalidateQueries({
            queryKey: ["balances", address],
          });
        }
      } catch (err) {
        console.error("privy_friendbot_failed", err);
        addNotification(t("fundingFailedTitle"), "error", {
          description: t("fundingFailedDescription"),
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, userId]);

  return null;
}
