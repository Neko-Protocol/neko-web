"use client";

import React, { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useProInvest } from "../../hooks/useProInvest";
import type {
  LaunchpadOpportunity,
  LaunchpadPlatform,
} from "../../services/opportunities.service";
import { FAUCET_MAX_USDC } from "../../services/opportunities.service";
import type { VaultSnapshot } from "../../services/proChain.service";
import type { OpportunityStatus } from "../../types/opportunity";
import { fromUnits } from "../../utils/amounts";
import { PRO_SPINNER, PRO_SPINNER_DARK } from "./proSpinner";

const PRIMARY_BUTTON =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90 disabled:opacity-50";
const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/30 hover:text-white disabled:opacity-50";

interface InvestPanelProps {
  item: LaunchpadOpportunity;
  platform: LaunchpadPlatform;
  vault: VaultSnapshot;
  status: OpportunityStatus;
}

export function InvestPanel({
  item,
  platform,
  vault,
  status,
}: InvestPanelProps) {
  const t = useTranslations("sharedPro.invest");
  const format = useFormatter();
  const invest = useProInvest(item, platform, vault);
  const [amount, setAmount] = useState("");

  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  const remaining = fromUnits(vault.config.target - vault.raised);

  if (status !== "open") {
    return (
      <Panel title={t("title")}>
        <p className="text-sm text-white/50">{t(`closed.${status}`)}</p>
      </Panel>
    );
  }

  if (!invest.assetSupported) {
    return (
      <Panel title={t("title")}>
        <p className="text-sm text-white/50">{t("unsupportedAsset")}</p>
      </Panel>
    );
  }

  if (invest.step === "register") {
    return (
      <Panel title={t("title")}>
        <p className="text-sm text-white/50">{t("register.body")}</p>
        <button
          type="button"
          onClick={invest.register}
          disabled={invest.registering}
          className={PRIMARY_BUTTON}
        >
          {invest.registering && (
            <LoadingSpinner size="sm" className={PRO_SPINNER_DARK} />
          )}
          {invest.registering ? t("register.pending") : t("register.cta")}
        </button>
      </Panel>
    );
  }

  if (invest.accountLoading) {
    return (
      <Panel title={t("title")}>
        <div className="flex justify-center py-6">
          <LoadingSpinner className={PRO_SPINNER} />
        </div>
      </Panel>
    );
  }

  if (invest.step === "fundAccount") {
    return (
      <Panel title={t("title")}>
        <p className="text-sm text-white/50">{t("fundAccount.body")}</p>
        <button
          type="button"
          onClick={invest.fundAccount}
          disabled={invest.funding}
          className={PRIMARY_BUTTON}
        >
          {invest.funding && (
            <LoadingSpinner size="sm" className={PRO_SPINNER_DARK} />
          )}
          {t("fundAccount.cta")}
        </button>
      </Panel>
    );
  }

  if (invest.step === "trustline") {
    return (
      <Panel title={t("title")}>
        <p className="text-sm text-white/50">
          {t("trustline.body", { code: platform.usdc_code })}
        </p>
        <button
          type="button"
          onClick={() => void invest.openTrustline()}
          disabled={invest.pending !== null}
          className={PRIMARY_BUTTON}
        >
          {invest.pending === "trustline" && (
            <LoadingSpinner size="sm" className={PRO_SPINNER_DARK} />
          )}
          {t("trustline.cta", { code: platform.usdc_code })}
        </button>
      </Panel>
    );
  }

  const ruleError = amount ? invest.checkAmount(amount) : null;
  const onInvest = async () => {
    const hash = await invest.invest(amount);
    if (hash) setAmount("");
  };

  return (
    <Panel title={t("title")}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-white/50">{t("balance")}</span>
        <span className="font-semibold text-white tabular-nums">
          {usd(fromUnits(invest.usdcBalance))} {platform.usdc_code}
        </span>
      </div>
      <button
        type="button"
        onClick={() =>
          invest.requestTestUsdc(
            Number(amount) > 0 ? Number(amount) : FAUCET_MAX_USDC
          )
        }
        disabled={invest.requestingUsdc}
        className={SECONDARY_BUTTON}
      >
        {invest.requestingUsdc && (
          <LoadingSpinner size="sm" className={PRO_SPINNER} />
        )}
        {t("faucet")}
      </button>

      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-white/40 uppercase">
          {t("amountLabel")}
        </span>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder={String(item.min_ticket)}
          className="w-full rounded-xl border border-white/10 bg-[#121212] px-4 py-3 text-lg text-white tabular-nums outline-none placeholder:text-white/20 focus:border-white/30"
        />
      </label>
      <p className="text-xs text-white/40">
        {t("limits", {
          min: usd(item.min_ticket),
          remaining: usd(remaining),
        })}
      </p>
      {ruleError && (
        <p className="text-xs text-red-400">
          {t(`errors.${ruleError}`, { code: platform.usdc_code })}
        </p>
      )}

      <button
        type="button"
        onClick={() => void onInvest()}
        disabled={!amount || ruleError !== null || invest.pending !== null}
        className={PRIMARY_BUTTON}
      >
        {invest.pending === "invest" && (
          <LoadingSpinner size="sm" className={PRO_SPINNER_DARK} />
        )}
        {t("cta", { symbol: item.token_symbol })}
      </button>
    </Panel>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#1C1C1C] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}
