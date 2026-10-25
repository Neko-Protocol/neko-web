"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/ui/PageContainer";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { sanitizeAmountInput } from "@/lib/helpers/tokenDisplay";
import { CATEGORY_ICON } from "../../constants/categories";
import {
  getFundingHistory,
  getProOpportunity,
} from "../../constants/opportunities";
import { PRO_ROUTES } from "../../constants/routes";
import type { ProOpportunity } from "../../types/opportunity";
import { CurvedPhoto } from "../ui/CurvedPhoto";

interface ProOpportunityDetailPageProps {
  id: string;
}

export function ProOpportunityDetailPage({
  id,
}: ProOpportunityDetailPageProps) {
  const t = useTranslations("sharedPro.detail");
  const opportunity = getProOpportunity(id);

  if (!opportunity) {
    return (
      <PageContainer maxWidth="6xl">
        <BackLink />
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-12 text-center">
          <p className="text-lg text-white/40">{t("notFound")}</p>
        </div>
      </PageContainer>
    );
  }

  return <OpportunityDetail opportunity={opportunity} />;
}

function BackLink() {
  const t = useTranslations("sharedPro.detail");
  return (
    <Link
      href={PRO_ROUTES.base}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {t("back")}
    </Link>
  );
}

function OpportunityDetail({ opportunity }: { opportunity: ProOpportunity }) {
  const t = useTranslations("sharedPro.detail");
  const [investTab, setInvestTab] = useState<InvestTab>("buy");
  const investPanelRef = useRef<HTMLElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  // Invest button: open Buy, bring the panel into view, focus the amount.
  const [investOpen, setInvestOpen] = useState(false);

  // Invest button toggles the panel. Opening switches to Buy and focuses the
  // amount; on small screens, where the panel stacks below, it scrolls there.
  const toggleInvest = () => {
    if (investOpen) {
      setInvestOpen(false);
      return;
    }
    setInvestOpen(true);
    setInvestTab("buy");
    requestAnimationFrame(() => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        investPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      amountRef.current?.focus({ preventScroll: true });
    });
  };
  const tCard = useTranslations("sharedPro.card");
  const tCategory = useTranslations("sharedPro.categories");
  const tPayout = useTranslations("sharedPro.payout");
  const tOpportunity = useTranslations(
    `sharedPro.opportunities.${opportunity.id}`
  );
  const format = useFormatter();

  const Icon = CATEGORY_ICON[opportunity.category];
  const name = tOpportunity("name");
  const apy = format.number(opportunity.targetApy / 100, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const highlights = tOpportunity.raw("highlights") as string[];

  const terms = [
    { label: tCard("targetApy"), value: apy },
    {
      label: tCard("term"),
      value: tCard("months", { count: opportunity.termMonths }),
    },
    { label: t("minInvestment"), value: usd(opportunity.minInvestmentUsd) },
    { label: t("payout"), value: tPayout(opportunity.payout) },
  ];

  const attributes = [
    { label: t("issuer"), value: tOpportunity("issuer") },
    { label: t("location"), value: tOpportunity("location") },
    { label: t("assetType"), value: tCategory(opportunity.category) },
    { label: t("token"), value: opportunity.tokenSymbol },
    { label: t("tokenStandard"), value: t("tokenStandardValue") },
    { label: t("network"), value: "Stellar" },
    { label: t("payout"), value: tPayout(opportunity.payout) },
    {
      label: tCard("term"),
      value: tCard("months", { count: opportunity.termMonths }),
    },
  ];

  return (
    <PageContainer maxWidth="6xl">
      <BackLink />

      {/* The invest panel is a right column that grows from 0 to 22rem. */}
      <div
        className={`grid grid-cols-1 items-start transition-[grid-template-columns,column-gap] duration-500 ease-in-out ${
          investOpen
            ? "gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
            : "lg:grid-cols-[minmax(0,1fr)_0rem] lg:gap-x-0"
        }`}
      >
        <div
          id="pro-invest-panel"
          inert={!investOpen}
          className={`min-w-0 overflow-clip transition-[opacity,translate] duration-500 ease-in-out order-last ${
            investOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0 max-lg:hidden"
          }`}
        >
          <div className="lg:w-[22rem]">
            <InvestPanel
              opportunity={opportunity}
              tab={investTab}
              onTabChange={setInvestTab}
              panelRef={investPanelRef}
              amountRef={amountRef}
            />
          </div>
        </div>

        <div className="min-w-0">
          <CurvedPhoto
            src={opportunity.imageSrc}
            alt={name}
            gradient={opportunity.gradient}
            fallbackIcon={Icon}
            sizes="(min-width: 1024px) 60vw, 100vw"
            variant="hero"
            framed
            className="h-72 sm:h-60"
          >
            <div className="absolute inset-0 bg-black/45" aria-hidden />

            <div className="absolute top-4 right-6 text-right text-white">
              <p className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
                {apy}
              </p>
              <p className="mt-1.5 text-xs font-medium tracking-wider uppercase">
                {tCard("targetApy")}
              </p>
            </div>

            {/* Left column sits beside the APY and stays above the notch (the
                lower 18% on the left). */}
            <div className="absolute top-4 left-5 max-w-[60%] sm:left-6">
              <h1 className="text-3xl leading-tight font-semibold text-white">
                {name}
              </h1>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/80">
                {tOpportunity("description")}
              </p>
            </div>
          </CurvedPhoto>

          <section className="relative -mt-4 mb-8 pl-2">
            <h2 className="mb-4 text-2xl font-bold text-white">
              {t("overview")}
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              {tOpportunity("summary")}
            </p>
            {/* Spacing lives on a wrapper: a global stylesheet resets button
                margins, which overrides margin utilities on the button. */}
            <div className="pt-8">
              <button
                type="button"
                onClick={toggleInvest}
                aria-expanded={investOpen}
                aria-controls="pro-invest-panel"
                className="rounded-lg bg-[#229EDF] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1a8bc7]"
              >
                {investOpen ? t("hideInvest") : t("investCta")}
              </button>
            </div>
          </section>

          <FolderTabs
            tabs={[
              {
                id: "highlights",
                label: t("highlights"),
                content: (
                  <>
                    <ul className="mb-6 space-y-2">
                      {highlights.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-sm leading-relaxed text-white/80"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <Rows rows={terms} />
                    <FundingChart opportunity={opportunity} />
                  </>
                ),
              },
              {
                id: "details",
                label: t("details"),
                content: <Rows rows={attributes} />,
              },
            ]}
          />
        </div>
      </div>
    </PageContainer>
  );
}

interface TabSpec {
  id: string;
  label: string;
  content: React.ReactNode;
}

const FOLDER_TAB_HEIGHT = 52;
const FOLDER_RADIUS = 28;
const FOLDER_TAB_RADIUS = 18;
const FOLDER_WING = 44;

/**
 * Outline of a file folder in px: a body with rounded corners and, on top,
 * the active tab spanning [left, left + width]. The tab eases into the body
 * through S-curves on each side; when it starts at the left edge it keeps a
 * rounded top-left corner instead of a left curve.
 */
function folderPath(w: number, h: number, left: number, width: number): string {
  const T = FOLDER_TAB_HEIGHT;
  const r = FOLDER_RADIUS;
  const tr = FOLDER_TAB_RADIUS;
  const wing = FOLDER_WING;
  const x0 = Math.max(0, left);
  const x1 = Math.min(w - r - wing, left + width);

  const rightWing = `C${x1 + wing * 0.5},0 ${x1 + wing * 0.5},${T} ${x1 + wing},${T}`;
  const rest = `H${w - r} Q${w},${T} ${w},${T + r} V${h - r} Q${w},${h} ${w - r},${h} H${r} Q0,${h} 0,${h - r}`;

  if (x0 < 1) {
    return `M0,${tr} Q0,0 ${tr},0 H${x1} ${rightWing} ${rest} Z`;
  }
  const leftWingStart = Math.max(r, x0 - wing);
  return `M0,${T + r} Q0,${T} ${r},${T} H${leftWingStart} C${leftWingStart + (x0 - leftWingStart) * 0.5},${T} ${leftWingStart + (x0 - leftWingStart) * 0.5},0 ${x0},0 H${x1} ${rightWing} ${rest} Z`;
}

/**
 * Glass panel shaped like a file folder. The active tab is part of the
 * folder's outline and glides to the selected tab in under 200ms, and the
 * body eases to the new content's height.
 */
function FolderTabs({ tabs }: { tabs: TabSpec[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.id === activeId)
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [target, setTarget] = useState<{ left: number; width: number } | null>(
    null
  );
  const [tab, setTab] = useState<{ left: number; width: number } | null>(null);
  // Latest tweened position, read when a new tween starts.
  const tabRef = useRef<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      setSize({ w: container.offsetWidth, h: container.offsetHeight });
      const el = tabRefs.current[activeIndex];
      if (el) setTarget({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activeIndex]);

  // Tween the tab towards its target so the outline glides between tabs.
  useEffect(() => {
    if (!target) return;
    const from = tabRef.current;
    if (!from) {
      tabRef.current = target;
      setTab(target);
      return;
    }
    const start = performance.now();
    const duration = 180;
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic: moves right away and lands softly.
      const e = 1 - Math.pow(1 - p, 3);
      const next = {
        left: from.left + (target.left - from.left) * e,
        width: from.width + (target.width - from.width) * e,
      };
      tabRef.current = next;
      setTab(next);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  const d =
    size && tab ? folderPath(size.w, size.h, tab.left, tab.width) : null;

  return (
    <div ref={containerRef} className="relative mb-10">
      {d && (
        <>
          <div
            className="absolute inset-0 bg-white/[0.04] backdrop-blur-xl"
            style={{ clipPath: `path("${d}")` }}
            aria-hidden
          />
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <path d={d} fill="none" stroke="rgba(255,255,255,0.12)" />
          </svg>
        </>
      )}

      <div
        role="tablist"
        className="relative flex gap-10"
        style={{ height: FOLDER_TAB_HEIGHT }}
      >
        {tabs.map((t, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveId(t.id)}
              className={`px-7 text-base font-medium transition-colors duration-150 ${
                active ? "text-white" : "text-white/45 hover:text-white/75"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <AutoHeight>
        <div
          role="tabpanel"
          key={tabs[activeIndex]?.id}
          className="relative animate-in fade-in-0 p-6 duration-150 ease-out"
        >
          {tabs[activeIndex]?.content}
        </div>
      </AutoHeight>
    </div>
  );
}

/** Animates its height to follow its content instead of jumping. */
function AutoHeight({ children }: { children: React.ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const measure = () => setHeight(inner.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="relative overflow-hidden transition-[height] duration-200 ease-out"
      style={{ height: height ?? "auto" }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 backdrop-blur-md">
      {rows.map(({ label, value }) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-0"
        >
          <dt className="text-sm text-white/80">{label}</dt>
          <dd className="text-right text-sm font-medium text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FundingChart({ opportunity }: { opportunity: ProOpportunity }) {
  const t = useTranslations("sharedPro.detail");
  const tCard = useTranslations("sharedPro.card");
  const format = useFormatter();
  const history = getFundingHistory(opportunity);
  const fundedPct = Math.min(
    100,
    Math.round((opportunity.raisedUsd / opportunity.targetUsd) * 100)
  );

  const compact = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  // Split "$182.4K" into the figure and its unit so the unit can be dimmed.
  const headline = compact(opportunity.raisedUsd);
  const unitMatch = headline.match(/^(.*?)([A-Za-z]+)$/);
  const figure = unitMatch ? unitMatch[1] : headline;
  const unit = unitMatch ? unitMatch[2] : "";

  return (
    <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
      <p className="text-sm text-white/60">{t("totalRaised")}</p>
      <p className="mt-1 text-5xl font-light tracking-tight text-white">
        {figure}
        <span className="text-white/40">{unit}</span>
      </p>
      <p className="mt-2 text-sm text-white/50">
        {t("ofTarget", {
          pct: fundedPct,
          target: compact(opportunity.targetUsd),
        })}
      </p>

      {history.length > 0 ? (
        <div className="mt-6 h-56 rounded-2xl bg-white/[0.04]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 16, right: 0, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="pro-funding-fill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="timestamp"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(ts) =>
                  format.dateTime(new Date(Number(ts)), {
                    day: "numeric",
                    month: "short",
                  })
                }
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                height={32}
              />
              <YAxis
                orientation="right"
                tickFormatter={(v) => compact(Number(v))}
                tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={64}
              />
              <Tooltip
                formatter={(v) => [compact(Number(v)), tCard("raisedLabel")]}
                labelFormatter={(ts) =>
                  format.dateTime(new Date(Number(ts)), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                }
                contentStyle={{
                  background: "#111111",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  color: "white",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.75)" }}
              />
              <Area
                type="monotone"
                dataKey="raisedUsd"
                stroke="#FFFFFF"
                strokeWidth={2}
                strokeLinecap="round"
                dot={false}
                activeDot={{ r: 4, fill: "#FFFFFF", strokeWidth: 0 }}
                animationDuration={900}
                animationEasing="ease-out"
                fill="url(#pro-funding-fill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-56 items-center justify-center rounded-2xl bg-white/[0.04]">
          <p className="text-sm text-white/45">{t("noFundingYet")}</p>
        </div>
      )}
    </section>
  );
}

type InvestTab = "buy" | "withdraw";

function InvestPanel({
  opportunity,
  tab,
  onTabChange,
  panelRef,
  amountRef,
}: {
  opportunity: ProOpportunity;
  tab: InvestTab;
  onTabChange: (tab: InvestTab) => void;
  panelRef: React.RefObject<HTMLElement | null>;
  amountRef: React.RefObject<HTMLInputElement | null>;
}) {
  const t = useTranslations("sharedPro.detail.invest");
  const tPayout = useTranslations("sharedPro.payout");
  const format = useFormatter();
  const [amountInput, setAmountInput] = useState("");
  const { balance: usdcBalance } = useTokenBalance("USDC");

  const token = opportunity.tokenSymbol;
  const isBuy = tab === "buy";
  // The token is not issued on-chain yet, so nobody holds a position.
  const positionBalance = "0";
  const balance = isBuy ? usdcBalance : positionBalance;
  const unit = isBuy ? "USDC" : token;

  const amount = parseFloat(amountInput) || 0;
  const hasAmount = amount > 0;
  const exceedsBalance = hasAmount && amount > parseFloat(balance) + 1e-10;
  const belowMin = isBuy && hasAmount && amount < opportunity.minInvestmentUsd;
  const yearly = (amount * opportunity.targetApy) / 100;
  const isOpen = opportunity.status === "open";

  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const units = (value: string) =>
    format.number(parseFloat(value) || 0, { maximumFractionDigits: 2 });

  const switchTab = (next: InvestTab) => {
    onTabChange(next);
    setAmountInput("");
  };

  return (
    <aside ref={panelRef} className="flex flex-col gap-3 lg:sticky lg:top-6">
      <div className="flex gap-1 rounded-xl bg-white/6 p-1">
        {(["buy", "withdraw"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => switchTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === key
                ? "bg-[#229EDF] text-white"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {t(key === "buy" ? "buyTab" : "withdrawTab")}
          </button>
        ))}
      </div>

      <div
        className={`rounded-2xl border bg-[#1A1A1A] p-4 transition-colors ${
          hasAmount ? "border-[#229EDF]/70" : "border-white/10"
        }`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-white/60">
            {isBuy ? t("buyLabel", { token }) : t("withdrawLabel", { token })}
          </span>
          {isBuy ? (
            <Image
              src="/assets/usdc-logo.png"
              alt="USDC"
              width={28}
              height={28}
              className="h-7 w-7 rounded-full"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[9px] font-bold text-white/70">
              {token.slice(0, 2)}
            </span>
          )}
        </div>

        <input
          type="text"
          ref={amountRef}
          inputMode="decimal"
          placeholder="0"
          aria-label={t("amountAriaLabel", { unit })}
          value={amountInput}
          onChange={(e) => setAmountInput(sanitizeAmountInput(e.target.value))}
          className="mb-3 w-full bg-transparent font-medium text-white outline-none placeholder:text-white/20"
          style={{
            fontSize: 33,
            fontFamily: '"FK Grotesk", "Inter", sans-serif',
          }}
        />

        <div className="flex items-center justify-between">
          <span
            className={`text-sm tabular-nums ${hasAmount ? "text-white/50" : "text-white/20"}`}
          >
            {usd(amount)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-white/35">
              {units(balance)} {unit}
            </span>
            <button
              type="button"
              onClick={() => setAmountInput(balance)}
              className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/15"
            >
              {t("max")}
            </button>
          </div>
        </div>
      </div>

      {(exceedsBalance || belowMin) && (
        <p className="px-1 text-xs text-red-400">
          {exceedsBalance
            ? t("insufficientBalance")
            : t("belowMinimum", { amount: usd(opportunity.minInvestmentUsd) })}
        </p>
      )}

      <div className="space-y-3.5 rounded-2xl border border-white/5 bg-[#1A1A1A] px-4 py-3.5">
        <SummaryRow
          label={t("network")}
          value={
            <span className="flex items-center gap-1.5">
              <Image
                src="/assets/xlm-negro-logo.png"
                alt=""
                width={14}
                height={14}
                className="h-3.5 w-3.5 rounded-sm invert"
              />
              <span className="font-medium text-white/80">Stellar</span>
            </span>
          }
        />
        {isBuy ? (
          <>
            <SummaryRow
              label={t("minimum")}
              value={
                <span className="text-white/60">
                  {usd(opportunity.minInvestmentUsd)}
                </span>
              }
            />
            <SummaryRow
              label={t("apy")}
              value={
                <span className="font-semibold text-white">
                  {format.number(opportunity.targetApy / 100, {
                    style: "percent",
                    maximumFractionDigits: 2,
                  })}
                </span>
              }
            />
            <SummaryRow
              label={t("projectedMonthly")}
              value={
                <span className="font-semibold text-white">
                  {usd(yearly / 12)}
                </span>
              }
            />
            <SummaryRow
              label={t("projectedYearly")}
              value={
                <span className="font-semibold text-white">{usd(yearly)}</span>
              }
            />
          </>
        ) : (
          <>
            <SummaryRow
              label={t("yourPosition", { token })}
              value={
                <span className="text-white/60">
                  {units(positionBalance)} {token}
                </span>
              }
            />
            <SummaryRow
              label={t("payoutSchedule")}
              value={
                <span className="font-semibold text-white">
                  {tPayout(opportunity.payout)}
                </span>
              }
            />
          </>
        )}
      </div>

      <button
        type="button"
        disabled
        className="flex w-full items-center justify-center rounded-xl bg-[#229EDF] py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#1a8bc7] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!isOpen
          ? t("comingSoon")
          : isBuy
            ? t("buyButton", { token })
            : t("withdrawButton", { token })}
      </button>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/50">{label}</span>
      <div className="text-sm tabular-nums">{value}</div>
    </div>
  );
}
