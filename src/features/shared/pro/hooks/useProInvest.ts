"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { TOAST_CONFIG } from "@/lib/constants/toast.config";
import { proFriendbotUrl } from "../config/proNetwork";
import { proAccessService } from "../services/proAccess.service";
import {
  FAUCET_MAX_USDC,
  opportunitiesService,
  type LaunchpadOpportunity,
  type LaunchpadPlatform,
} from "../services/opportunities.service";
import {
  buildUsdcTrustline,
  buildVaultInvocation,
  readUsdcAccount,
  type VaultSnapshot,
} from "../services/proChain.service";
import { toUnits } from "../utils/amounts";
import { checkInvestAmount } from "../utils/investRules";
import { proAccessKeys } from "./proAccessKeys";
import { useProAccess } from "./useProAccess";
import { useProTransaction } from "./useProTransaction";

/** The first thing the investor still has to do before investing. */
export type InvestStep = "register" | "fundAccount" | "trustline" | "ready";

/**
 * The invest flow for one vault: on-chain identity, a testnet account, the
 * USDC trustline, test USDC, then `vault.invest`. Each step is derived from
 * live reads, so a reload resumes where the investor left off.
 */
export function useProInvest(
  item: LaunchpadOpportunity | null,
  platform: LaunchpadPlatform | null,
  vault: VaultSnapshot | null
) {
  const t = useTranslations("sharedPro.invest");
  const queryClient = useQueryClient();
  const { addNotification } = useToast();
  const access = useProAccess();
  const address = access.address;
  const tx = useProTransaction();

  const asset = platform
    ? { code: platform.usdc_code, issuer: platform.usdc_issuer }
    : null;
  // Launchpad vaults take the platform USDC; any other asset has no faucet
  // and no trustline Pro knows how to open.
  const assetSupported = Boolean(
    platform && vault && vault.config.usdc === platform.usdc
  );

  const account = useQuery({
    queryKey: proAccessKeys.usdcAccount(address),
    queryFn: () => readUsdcAccount(address!, asset!),
    enabled: Boolean(address && asset),
    staleTime: 15_000,
  });

  const register = useMutation({
    mutationFn: () => proAccessService.registerOnchain(address!),
    onSuccess: (investor) =>
      queryClient.setQueryData(proAccessKeys.investor(address), investor),
    onError: tx.notifyError,
  });

  // A whitelisted wallet whose registration failed is retried once on its
  // own; the button stays for further attempts.
  const needsRegistration =
    access.investor?.whitelisted === true && !access.investor.onchain;
  const { mutate: registerNow, isIdle: registerIdle } = register;
  useEffect(() => {
    if (needsRegistration && registerIdle) registerNow();
  }, [needsRegistration, registerIdle, registerNow]);

  const fundAccount = useMutation({
    mutationFn: async () => {
      const res = await fetch(proFriendbotUrl(address!));
      if (!res.ok) throw new Error(`Friendbot failed (${res.status})`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: proAccessKeys.usdcAccount(address),
      }),
    onError: tx.notifyError,
  });

  const faucet = useMutation({
    mutationFn: (amount: number) =>
      opportunitiesService.requestTestUsdc(
        address!,
        Math.min(FAUCET_MAX_USDC, Math.max(1, Math.ceil(amount)))
      ),
    onSuccess: () => {
      addNotification(t("faucetSuccessTitle"), "success", {
        ...TOAST_CONFIG.defaultOpts,
        description: t("faucetSuccess"),
      });
      return queryClient.invalidateQueries({
        queryKey: proAccessKeys.usdcAccount(address),
      });
    },
    onError: tx.notifyError,
  });

  const onchain = access.investor?.onchain === true;
  let step: InvestStep;
  if (!onchain) step = "register";
  else if (account.data && !account.data.exists) step = "fundAccount";
  else if (account.data && !account.data.trustline) step = "trustline";
  else step = "ready";

  const balance = account.data?.balance ?? 0n;

  const invest = (amount: string) => {
    if (!item || !vault) return Promise.resolve(null);
    const error = checkInvestAmount({
      amount,
      minTicket: item.min_ticket,
      vault,
      balance,
    });
    if (error) return Promise.resolve(null);
    return tx.run(
      "invest",
      (source) =>
        buildVaultInvocation(source, item.vault, "invest", toUnits(amount)),
      t("success", { amount, symbol: item.token_symbol })
    );
  };

  return {
    address,
    step,
    assetSupported,
    /** The investor record exists only after the Pro KYC (not Launchpad's). */
    hasInvestorRecord: Boolean(access.investor),
    usdcBalance: balance,
    accountLoading: account.isPending && Boolean(address && asset),
    checkAmount: (amount: string) =>
      vault && item
        ? checkInvestAmount({
            amount,
            minTicket: item.min_ticket,
            vault,
            balance,
          })
        : null,
    register: () => register.mutate(),
    registering: register.isPending,
    fundAccount: () => fundAccount.mutate(),
    funding: fundAccount.isPending,
    openTrustline: () =>
      tx.run(
        "trustline",
        (source) => buildUsdcTrustline(source, asset!),
        t("trustlineSuccess")
      ),
    requestTestUsdc: (amount: number) => faucet.mutate(amount),
    requestingUsdc: faucet.isPending,
    invest,
    pending: tx.pending,
  };
}
