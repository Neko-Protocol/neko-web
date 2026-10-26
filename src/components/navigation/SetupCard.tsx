"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConnectModalStore } from "@/features/shared/wallet/stores/connectModal.store";
import { useReferralStore } from "@/features/shared/referral/stores/referral.store";
import { CARD_STYLES, CARD_BUTTON_STYLES } from "./sidebarConfig";

export function SetupCard() {
  const t = useTranslations("common.wallet");
  const openConnectModal = useConnectModalStore((s) => s.open);
  const refCode = useReferralStore((s) => s.refCode);

  return (
    <div className={CARD_STYLES}>
      <p className="mb-6 text-base font-bold leading-snug text-black">
        {t("connectToGetStarted")}
      </p>
      <button
        type="button"
        onClick={openConnectModal}
        className={CARD_BUTTON_STYLES}
      >
        {t("startInvesting")}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </button>

      {refCode && (
        <p className="mt-3 text-xs font-semibold text-black/50">
          {t("referralCodeApplied", { code: refCode })}
        </p>
      )}
    </div>
  );
}
