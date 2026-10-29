"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ReadonlyRow } from "@/components/ui/ReadonlyRow";
import { BackendError } from "@/lib/services/backend-client";
import { useApiErrorMessage } from "@/lib/helpers/useApiErrorMessage";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { meQueryKey, useMe } from "@/features/shared/wallet/privy/useMe";
import { ensurePrivyWalletActivated } from "@/features/shared/wallet/privy/sponsoredTx";

interface PrivyAccountRowsProps {
  copy: (key: string, value: string) => void;
  copiedKey: string | null;
}

export function PrivyAccountRows({ copy, copiedKey }: PrivyAccountRowsProps) {
  const t = useTranslations("sharedSettings.wallet");
  const getErrorMessage = useApiErrorMessage();
  const queryClient = useQueryClient();
  const address = useStellarWalletStore((s) => s.address);
  const { data: me } = useMe();
  const [activating, setActivating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const wallet = me?.wallets.find((w) => w.address === address);
  const isActivated = wallet?.activation_status === "activated";

  const handleActivate = async () => {
    setActivating(true);
    setError(null);
    try {
      await ensurePrivyWalletActivated();
      await queryClient.invalidateQueries({ queryKey: meQueryKey(address) });
      await queryClient.invalidateQueries({ queryKey: ["balances"] });
    } catch (err) {
      setError(getErrorMessage(err instanceof BackendError ? err.code : null));
    } finally {
      setActivating(false);
    }
  };

  return (
    <>
      {me?.account.email && (
        <ReadonlyRow
          label={t("email")}
          value={me.account.email}
          copyKey="email"
          copyValue={me.account.email}
          onCopy={copy}
          copiedKey={copiedKey}
        />
      )}

      {wallet && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#2A2A2A] px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-white/40">{t("accountStatus")}</span>
            <span
              className={
                isActivated
                  ? "text-sm font-medium text-emerald-400"
                  : "text-sm font-medium text-white/80"
              }
            >
              {isActivated ? t("activated") : t("notActivated")}
            </span>
          </div>
          {!isActivated && (
            <button
              type="button"
              onClick={() => void handleActivate()}
              disabled={activating}
              className="flex items-center gap-2 rounded-lg bg-[#229EDF] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a8bc7] disabled:opacity-50"
            >
              {activating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t("activate")}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}
    </>
  );
}
