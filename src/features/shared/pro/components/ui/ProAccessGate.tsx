"use client";

import React from "react";
import { ShieldCheck, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PageContainer } from "@/components/ui/PageContainer";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useProAccess } from "../../hooks/useProAccess";
import { PRO_SPINNER } from "./proSpinner";
import { ProVerification } from "./ProVerification";

/**
 * Neko Pro is for verified investors: the connected wallet must be
 * whitelisted by an approved KYC (individual) or KYB (business) before
 * `children` render.
 */
export function ProAccessGate({ children }: { children: React.ReactNode }) {
  const access = useProAccess();

  if (access.whitelisted) return <>{children}</>;

  return (
    <PageContainer maxWidth="7xl">
      {/* Fills the viewport left by the (app) template/main padding and the
          mobile header, so the card sits in the middle of the screen. */}
      <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-xl flex-col justify-center sm:min-h-[calc(100dvh-9rem)] lg:min-h-[calc(100dvh-5rem)]">
        {!access.address ? (
          <ConnectPrompt />
        ) : access.isLoading ? (
          <div className="flex justify-center rounded-2xl border border-white/5 bg-[#1C1C1C] p-12">
            <LoadingSpinner className={PRO_SPINNER} />
          </div>
        ) : access.isError ? (
          <AccessError onRetry={access.refetch} />
        ) : (
          <ProVerification key={access.address} wallet={access.address} />
        )}
      </div>
    </PageContainer>
  );
}

function ConnectPrompt() {
  const t = useTranslations("sharedPro.verification");
  const { connect } = useStellarWallet();

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-[#1C1C1C] p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#229EDF]/10">
        <ShieldCheck className="h-6 w-6 text-[#229EDF]" aria-hidden />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-white">
          {t("connect.title")}
        </h2>
        <p className="mt-1 text-sm text-white/50">{t("connect.body")}</p>
      </div>
      <button
        type="button"
        onClick={() => void connect()}
        className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90"
      >
        <Wallet className="h-4 w-4" aria-hidden />
        {t("connect.cta")}
      </button>
    </div>
  );
}

function AccessError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations("sharedPro.verification");
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-8 text-center">
      <p className="text-sm text-white/60">{t("errors.accessCheckFailed")}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 text-xs font-semibold text-[#229EDF] hover:underline"
      >
        {t("retry")}
      </button>
    </div>
  );
}
