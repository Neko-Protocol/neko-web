"use client";

import React from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useProTransaction } from "../../hooks/useProTransaction";
import {
  buildVaultInvocation,
  type InvestorAction,
  type VaultPosition,
} from "../../services/proChain.service";
import type { ProOpportunity } from "../../types/opportunity";
import { fromUnits } from "../../utils/amounts";
import { PRO_SPINNER_DARK } from "./proSpinner";

/** The one exit each vault state allows. */
const ACTION_BY_STATUS: Partial<
  Record<NonNullable<ProOpportunity["status"]>, InvestorAction>
> = {
  settled: "redeem",
  active: "early_exit",
  failed: "refund",
};

interface ProPositionCardProps {
  opportunity: ProOpportunity;
  position: VaultPosition;
  /** Hides the link to the detail page when already on it. */
  showLink?: boolean;
}

/**
 * A holding in one vault and the action its state allows: redeem once
 * settled, leave early while active (fails with `InsufficientLiquidity` until
 * enough has been repaid), refund at par after a failed round.
 */
export function ProPositionCard({
  opportunity,
  position,
  showLink = true,
}: ProPositionCardProps) {
  const t = useTranslations("sharedPro.position");
  const tStatus = useTranslations("sharedPro.status");
  const format = useFormatter();
  const tx = useProTransaction();

  const usd = (units: bigint) =>
    format.number(fromUnits(units), {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  const action = opportunity.status
    ? ACTION_BY_STATUS[opportunity.status]
    : undefined;
  const fee = position.balance - position.exitValue;
  const feePct =
    position.balance > 0n
      ? format.number(Number(fee) / Number(position.balance), {
          style: "percent",
          maximumFractionDigits: 2,
        })
      : null;

  const rows = [
    {
      label: t("holding"),
      value: `${format.number(fromUnits(position.balance), {
        maximumFractionDigits: 2,
      })} ${opportunity.tokenSymbol}`,
    },
    ...(opportunity.status === "settled"
      ? [{ label: t("claimable"), value: usd(position.claimable) }]
      : []),
    ...(opportunity.status === "active"
      ? [
          { label: t("exitValue"), value: usd(position.exitValue) },
          { label: t("exitFee", { pct: feePct ?? "0%" }), value: usd(fee) },
        ]
      : []),
    ...(opportunity.status === "failed"
      ? [{ label: t("refundable"), value: usd(position.balance) }]
      : []),
  ];

  const onAction = () => {
    if (!action) return;
    void tx.run(
      action,
      (source) => buildVaultInvocation(source, opportunity.vault, action),
      t(`success.${action}`, { name: opportunity.name })
    );
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-[#1C1C1C] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">
            {opportunity.name}
          </p>
          {opportunity.status && (
            <p className="mt-0.5 text-xs text-white/40">
              {tStatus(opportunity.status)}
            </p>
          )}
        </div>
        {showLink && (
          <Link
            href={`/pro/${encodeURIComponent(opportunity.id)}`}
            className="shrink-0 text-xs font-semibold text-[#229EDF] hover:underline"
          >
            {t("details")}
          </Link>
        )}
      </div>

      <dl className="space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4 text-sm">
            <dt className="text-white/50">{label}</dt>
            <dd className="font-semibold text-white tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {action ? (
        <>
          <button
            type="button"
            onClick={onAction}
            disabled={tx.pending !== null}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {tx.pending && (
              <LoadingSpinner size="sm" className={PRO_SPINNER_DARK} />
            )}
            {t(`actions.${action}`)}
          </button>
          {action === "early_exit" && (
            <p className="text-xs text-white/40">{t("earlyExitHint")}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-white/40">{t("locked")}</p>
      )}
    </div>
  );
}
