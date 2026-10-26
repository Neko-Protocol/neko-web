"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { TOAST_CONFIG } from "@/lib/constants/toast.config";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { signAndSubmit } from "@/features/shared/vault/utils/signAndSubmit";
import { getProRpcServer, PRO_NETWORK_PASSPHRASE } from "../config/proNetwork";
import { ContractCallError, waitForProTx } from "../services/proChain.service";
import { signProTransaction } from "../utils/proSigner";
import { proTxErrorKey } from "../utils/proTxError";
import { proAccessKeys } from "./proAccessKeys";

/**
 * Signs and sends Pro transactions on testnet through the vault feature's
 * `signAndSubmit`, waits for the ledger, then refreshes every Pro read.
 * Errors become a toast; `run` resolves to the hash, or `null` on failure or
 * when the user rejected the signature.
 */
export function useProTransaction() {
  const t = useTranslations("sharedPro.tx");
  const address = useStellarWalletStore((s) => s.address);
  const queryClient = useQueryClient();
  const { addNotification } = useToast();
  const [pending, setPending] = useState<string | null>(null);

  const notifyError = useCallback(
    (err: unknown) => {
      const key = proTxErrorKey(err);
      if (!key) return;
      addNotification(t("errorTitle"), "error", {
        ...TOAST_CONFIG.defaultOpts,
        description: t(`errors.${key}`),
      });
    },
    [addNotification, t]
  );

  const run = useCallback(
    async (
      label: string,
      build: (source: string) => Promise<string>,
      successMessage: string
    ): Promise<string | null> => {
      if (!address) return null;
      setPending(label);
      try {
        const xdr = await build(address);
        const result = await signAndSubmit(
          xdr,
          PRO_NETWORK_PASSPHRASE,
          signProTransaction,
          address,
          // LOBSTR multisig vaults are mainnet-only; Pro signs single-key.
          false,
          () => "",
          getProRpcServer()
        );
        if (result.kind !== "submitted") return null;
        const { sendResult } = result;
        if (sendResult.status === "ERROR") {
          throw new ContractCallError(
            `Transaction not accepted: ${
              sendResult.errorResult?.result().switch().name ?? "unknown"
            }`,
            null
          );
        }
        if (sendResult.status === "TRY_AGAIN_LATER") {
          throw new ContractCallError("Network congested, try again", null);
        }
        await waitForProTx(sendResult.hash);

        addNotification(t("successTitle"), "success", {
          ...TOAST_CONFIG.defaultOpts,
          description: successMessage,
        });
        await queryClient.invalidateQueries({ queryKey: proAccessKeys.all });
        return sendResult.hash;
      } catch (err) {
        notifyError(err);
        return null;
      } finally {
        setPending(null);
      }
    },
    [address, addNotification, notifyError, queryClient, t]
  );

  return { run, pending, notifyError };
}
