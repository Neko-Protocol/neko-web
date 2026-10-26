"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ReadonlyRow } from "@/components/ui/ReadonlyRow";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import {
  fundingQueryKey,
  useMe,
  usePrivyFunding,
} from "@/features/shared/wallet/privy/useMe";
import { usePrivyUserStore } from "@/features/shared/wallet/privy/privyUser.store";
import {
  CAN_FUND_WITH_FRIENDBOT,
  ensurePrivyWalletFunded,
} from "@/features/shared/wallet/privy/privyFunding";

interface PrivyAccountRowsProps {
  copy: (key: string, value: string) => void;
  copiedKey: string | null;
}

export function PrivyAccountRows({ copy, copiedKey }: PrivyAccountRowsProps) {
  const t = useTranslations("sharedSettings.wallet");
  const queryClient = useQueryClient();
  const address = useStellarWalletStore((s) => s.address);
  const privyEmail = usePrivyUserStore((s) => s.email);
  const { data: me } = useMe();
  const { data: funded } = usePrivyFunding();
  const [funding, setFunding] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const email = me?.account.email ?? privyEmail;

  const handleFund = async () => {
    if (!address) return;
    setFunding(true);
    setError(null);
    try {
      const ok = await ensurePrivyWalletFunded(address);
      queryClient.setQueryData(fundingQueryKey(address), ok);
      await queryClient.invalidateQueries({ queryKey: ["balances", address] });
    } catch {
      setError(t("fundFailed"));
    } finally {
      setFunding(false);
    }
  };

  return (
    <>
      {email && (
        <ReadonlyRow
          label={t("email")}
          value={email}
          copyKey="email"
          copyValue={email}
          onCopy={copy}
          copiedKey={copiedKey}
        />
      )}

      {me && (
        <div className="flex flex-col gap-0.5 rounded-xl bg-[#2A2A2A] px-4 py-3">
          <span className="text-xs text-white/40">{t("verification")}</span>
          <span
            className={
              me.verification.status === "approved"
                ? "text-sm font-medium text-emerald-400"
                : "text-sm font-medium text-white/80"
            }
          >
            {me.verification.status === "approved"
              ? t("verified", { kind: me.verification.kind.toUpperCase() })
              : t("notVerified")}
          </span>
        </div>
      )}

      {funded !== undefined && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#2A2A2A] px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-white/40">{t("accountStatus")}</span>
            <span
              className={
                funded
                  ? "text-sm font-medium text-emerald-400"
                  : "text-sm font-medium text-white/80"
              }
            >
              {funded ? t("funded") : t("notFunded")}
            </span>
          </div>
          {!funded && CAN_FUND_WITH_FRIENDBOT && (
            <button
              type="button"
              onClick={() => void handleFund()}
              disabled={funding}
              className="flex items-center gap-2 rounded-lg bg-[#229EDF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a8bc7] disabled:opacity-50"
            >
              {funding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("fund")}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </>
  );
}
