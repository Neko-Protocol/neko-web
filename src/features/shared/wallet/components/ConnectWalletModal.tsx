"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronRight, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePrivy } from "@privy-io/react-auth";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useReferralStore } from "@/features/shared/referral/stores/referral.store";
import { PRIVY_ENABLED } from "@/features/shared/wallet/privy/privyConfig";
import { getPrivySession } from "@/features/shared/wallet/privy/privySession";
import { useConnectModalStore } from "@/features/shared/wallet/stores/connectModal.store";
import { AuthModalShell } from "./AuthModalShell";

function EmailOption({ onStart }: { onStart: () => void }) {
  const t = useTranslations("common.wallet");
  const { ready, authenticated, login } = usePrivy();

  return (
    <div>
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          onStart();
          if (!authenticated) login();
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229EDF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a8bc7] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {ready ? (
          <Mail className="h-4 w-4" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {t("emailCta")}
      </button>
      <p className="mt-2 text-center text-xs text-white/40">{t("emailHint")}</p>
    </div>
  );
}

function Divider() {
  const t = useTranslations("common.wallet");
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-white/30">
      <span className="h-px flex-1 bg-white/10" />
      {t("or")}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function ConnectWalletModal() {
  const t = useTranslations("common.wallet");
  const { isOpen, close } = useConnectModalStore();
  const { connect } = useStellarWallet();
  const refCode = useReferralStore((s) => s.refCode);
  const [connecting, setConnecting] = useState(false);

  if (!isOpen) return null;

  const handleStellarConnect = async () => {
    setConnecting(true);
    try {
      await getPrivySession()?.logout();
      close();
      await connect();
    } catch {
    } finally {
      setConnecting(false);
    }
  };

  return (
    <AuthModalShell
      titleId="connect-modal-title"
      title={t("startInvesting")}
      subtitle={t("connectModalSubtitle")}
      onClose={close}
      closeLabel={t("close")}
    >
      {PRIVY_ENABLED && (
        <>
          <EmailOption onStart={close} />
          <Divider />
        </>
      )}

      <button
        type="button"
        disabled={connecting}
        onClick={() => void handleStellarConnect()}
        className="group flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Image
          src="/assets/xlm-logo.png"
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-full"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-white">
            {t("stellarOptionTitle")}
          </span>
          <span className="block truncate text-xs text-white/40">
            {t("stellarOptionDescription")}
          </span>
        </span>
        {connecting ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/50" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition-colors group-hover:text-white/70" />
        )}
      </button>

      {refCode && (
        <p className="mt-5 text-center text-xs text-white/40">
          {t("referralCodeApplied", { code: refCode })}
        </p>
      )}
    </AuthModalShell>
  );
}
