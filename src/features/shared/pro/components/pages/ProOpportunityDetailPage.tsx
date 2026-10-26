"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { proExplorer } from "../../config/proNetwork";
import { positionQuery } from "../../hooks/useProPositions";
import { useProOpportunity } from "../../hooks/useProOpportunity";
import type { Milestone, VaultTranche } from "../../services/proChain.service";
import type { ProOpportunity } from "../../types/opportunity";
import { fromUnits } from "../../utils/amounts";
import { InvestPanel } from "../ui/InvestPanel";
import { ProPositionCard } from "../ui/ProPositionCard";
import { ProTestnetNotice } from "../ui/ProTestnetNotice";
import { PRO_SPINNER } from "../ui/proSpinner";

const CARD = "rounded-2xl border border-white/5 bg-[#1C1C1C] p-5";

/** Unix seconds (u64 from the contract) to a Date. */
const fromUnix = (seconds: bigint) => new Date(Number(seconds) * 1000);

export function ProOpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("sharedPro.detail");
  const tStatus = useTranslations("sharedPro.status");
  const tCategory = useTranslations("sharedPro.categories");
  const format = useFormatter();
  const data = useProOpportunity(id);

  if (data.isLoading) {
    return (
      <PageContainer maxWidth="7xl">
        <div className="flex justify-center p-16">
          <LoadingSpinner className={PRO_SPINNER} />
        </div>
      </PageContainer>
    );
  }

  if (data.isError || !data.item || !data.opportunity || !data.platform) {
    return (
      <PageContainer maxWidth="7xl">
        <BackLink />
        <div className={`${CARD} text-center`}>
          <p className="text-white/50">{t("notFound")}</p>
        </div>
      </PageContainer>
    );
  }

  const { item, platform, opportunity, vault, milestones } = data;
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const pct = (value: number) =>
    format.number(value / 100, {
      style: "percent",
      maximumFractionDigits: 2,
    });

  const metrics = [
    { label: t("targetApy"), value: pct(opportunity.targetApy) },
    {
      label: t("term"),
      value: t("months", { count: opportunity.termMonths }),
    },
    { label: t("minTicket"), value: usd(opportunity.minInvestmentUsd) },
    {
      label: t("deadline"),
      value: format.dateTime(new Date(opportunity.fundingDeadline), {
        dateStyle: "medium",
      }),
    },
  ];

  const terms = [
    { label: t("terms.target"), value: usd(opportunity.targetUsd) },
    { label: t("terms.minTarget"), value: usd(opportunity.minTargetUsd) },
    ...(vault
      ? [
          {
            label: t("terms.expectedRepayment"),
            value: usd(fromUnits(vault.config.expected_repayment)),
          },
          {
            label: t("terms.exitFee"),
            value: t("terms.exitFeeValue", {
              current: pct(vault.exitFeeBps / 100),
              max: pct(vault.config.max_exit_fee_bps / 100),
            }),
          },
        ]
      : []),
    { label: t("terms.country"), value: opportunity.country },
    ...(item.offering_type
      ? [{ label: t("terms.offering"), value: item.offering_type }]
      : []),
    ...(item.investor_countries?.length
      ? [
          {
            label: t("terms.investorCountries"),
            value: item.investor_countries.join(", "),
          },
        ]
      : []),
    { label: t("terms.token"), value: opportunity.tokenSymbol },
  ];

  return (
    <PageContainer maxWidth="7xl">
      <BackLink />

      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white/5 px-2.5 py-1 font-semibold text-white/60">
            {tCategory(opportunity.category)}
          </span>
          {opportunity.status && (
            <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-[#121212]">
              {tStatus(opportunity.status)}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-semibold text-white">
          {opportunity.name}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/50">
          {opportunity.description}
        </p>
      </header>

      <ProTestnetNotice className="mb-6" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <dl className={`${CARD} grid grid-cols-2 gap-4 sm:grid-cols-4`}>
            {metrics.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-[10px] font-semibold tracking-wider text-white/40 uppercase">
                  {label}
                </dt>
                <dd className="mt-1 text-lg font-semibold text-white">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <FundingProgress opportunity={opportunity} />

          <section className={CARD}>
            <h2 className="mb-3 font-semibold text-white">
              {t("terms.title")}
            </h2>
            <dl className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
              {terms.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 text-sm">
                  <dt className="text-white/50">{label}</dt>
                  <dd className="text-right font-semibold text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className={CARD}>
            <h2 className="mb-3 font-semibold text-white">
              {t("schedule.title")}
            </h2>
            {vault ? (
              <RepaymentSchedule tranches={vault.tranches} />
            ) : (
              <ReadState failed={data.vaultError} />
            )}
          </section>

          <section className={CARD}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-semibold text-white">
                {t("milestones.title")}
              </h2>
              {milestones && (
                <span className="text-xs text-white/40">
                  {t("milestones.approved", {
                    approved: milestones.approved,
                    total: milestones.milestones.length,
                  })}
                </span>
              )}
            </div>
            {milestones ? (
              <MilestoneList milestones={milestones.milestones} />
            ) : (
              <ReadState failed={data.milestonesError} />
            )}
          </section>

          <section className={`${CARD} flex flex-wrap gap-4 text-sm`}>
            <ExplorerLink
              href={proExplorer.contract(opportunity.vault)}
              label={t("links.vault")}
            />
            <ExplorerLink
              href={proExplorer.contract(opportunity.token)}
              label={t("links.token", { symbol: opportunity.tokenSymbol })}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          {vault && opportunity.status ? (
            <InvestPanel
              item={item}
              platform={platform}
              vault={vault}
              status={opportunity.status}
            />
          ) : (
            <div className={CARD}>
              <ReadState failed={data.vaultError} />
            </div>
          )}
          <HeldPosition opportunity={opportunity} />
        </aside>
      </div>
    </PageContainer>
  );
}

function BackLink() {
  const t = useTranslations("sharedPro.detail");
  return (
    <Link
      href="/pro"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t("back")}
    </Link>
  );
}

function ReadState({ failed }: { failed: boolean }) {
  const t = useTranslations("sharedPro.detail");
  return failed ? (
    <p className="text-sm text-white/40">{t("readFailed")}</p>
  ) : (
    <div className="flex justify-center py-4">
      <LoadingSpinner size="sm" className={PRO_SPINNER} />
    </div>
  );
}

function FundingProgress({ opportunity }: { opportunity: ProOpportunity }) {
  const t = useTranslations("sharedPro.detail.funding");
  const format = useFormatter();
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const share = (value: number) =>
    opportunity.targetUsd > 0
      ? Math.min(100, (value / opportunity.targetUsd) * 100)
      : 0;
  const raised = opportunity.raisedUsd ?? 0;

  return (
    <section className={CARD}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-white/50">
          {t("raised", {
            raised: opportunity.raisedUsd === null ? "—" : usd(raised),
            target: usd(opportunity.targetUsd),
          })}
        </span>
        <span className="text-xs text-white/40">
          {t("minimum", { minimum: usd(opportunity.minTargetUsd) })}
        </span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={Math.round(share(raised))}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-white"
          style={{ width: `${share(raised)}%` }}
        />
        {/* The round fails below this line when funding closes. */}
        <div
          className="absolute inset-y-0 w-0.5 bg-yellow-400"
          style={{ left: `${share(opportunity.minTargetUsd)}%` }}
          aria-hidden
        />
      </div>
    </section>
  );
}

function RepaymentSchedule({ tranches }: { tranches: VaultTranche[] }) {
  const t = useTranslations("sharedPro.detail.schedule");
  const format = useFormatter();
  // Fixed at mount: "overdue" only needs day-level precision.
  const [now] = useState(() => Date.now());

  if (tranches.length === 0) {
    return <p className="text-sm text-white/40">{t("empty")}</p>;
  }

  return (
    <ol className="divide-y divide-white/5">
      {tranches.map((tranche) => {
        const paid = tranche.paid_amount > 0n;
        const due = fromUnix(tranche.due_date);
        const state = paid ? "paid" : due.getTime() < now ? "overdue" : "due";
        return (
          <li
            key={tranche.index}
            className="flex items-center justify-between gap-4 py-2.5 text-sm"
          >
            <div>
              <p className="text-white">
                {t("tranche", { number: tranche.index + 1 })}
              </p>
              <p className="text-xs text-white/40">
                {paid
                  ? t("paidOn", {
                      date: format.dateTime(fromUnix(tranche.paid_at), {
                        dateStyle: "medium",
                      }),
                    })
                  : t("dueOn", {
                      date: format.dateTime(due, { dateStyle: "medium" }),
                    })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white tabular-nums">
                {format.number(
                  fromUnits(
                    paid ? tranche.paid_amount : tranche.expected_amount
                  ),
                  { style: "currency", currency: "USD" }
                )}
              </p>
              <p
                className={`text-xs ${
                  state === "paid"
                    ? "text-emerald-400"
                    : state === "overdue"
                      ? "text-red-400"
                      : "text-white/40"
                }`}
              >
                {t(`states.${state}`)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  const t = useTranslations("sharedPro.detail.milestones");

  if (milestones.length === 0) {
    return <p className="text-sm text-white/40">{t("empty")}</p>;
  }

  return (
    <ol className="divide-y divide-white/5">
      {milestones.map((milestone) => (
        <li
          key={milestone.index}
          className="flex items-center justify-between gap-4 py-2.5 text-sm"
        >
          <span className="text-white">{milestone.title}</span>
          <span
            className={`shrink-0 text-xs font-semibold ${
              milestone.status === "Approved"
                ? "text-emerald-400"
                : milestone.status === "Rejected"
                  ? "text-red-400"
                  : "text-white/40"
            }`}
          >
            {t(`states.${milestone.status}`)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function ExplorerLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-semibold text-[#229EDF] hover:underline"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

/** The wallet's position in this vault, when it holds tokens. */
function HeldPosition({ opportunity }: { opportunity: ProOpportunity }) {
  const wallet = useStellarWalletStore((s) => s.address);
  const position = useQuery({
    ...positionQuery(opportunity, wallet ?? ""),
    enabled: Boolean(wallet),
  });
  if (!position.data || position.data.balance <= 0n) return null;
  return (
    <ProPositionCard
      opportunity={opportunity}
      position={position.data}
      showLink={false}
    />
  );
}
