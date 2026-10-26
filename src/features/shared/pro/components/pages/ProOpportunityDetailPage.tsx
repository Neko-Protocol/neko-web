"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageContainer } from "@/components/ui/PageContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useWallet } from "@/hooks/useWallet";
import { sanitizeAmountInput } from "@/lib/helpers/tokenDisplay";
import { CATEGORY_ICON } from "../../constants/categories";
import { explorerUrl, PRO_NETWORK } from "../../constants/deployments";
import { PRO_ROUTES } from "../../constants/routes";
import {
  useProBalance,
  useProVault,
  useVaultAction,
  useWithdrawValue,
} from "../../hooks/useProVaults";
import { VaultActionError, withdrawMethod } from "../../services/vaultActions";
import type { ProVault } from "../../types/vault";
import {
  fundedPct,
  paidTranches,
  termMonths,
  totalReturn,
} from "../../utils/vaultMath";
import { CurvedPhoto } from "../ui/CurvedPhoto";

interface ProOpportunityDetailPageProps {
  slug: string;
}

export function ProOpportunityDetailPage({
  slug,
}: ProOpportunityDetailPageProps) {
  const t = useTranslations("sharedPro.detail");
  const vault = useProVault(slug);

  if (vault.isPending) {
    return (
      <PageContainer maxWidth="6xl">
        <BackLink />
        <div className="flex justify-center rounded-2xl border border-white/5 bg-[#1C1C1C] p-12">
          <LoadingSpinner variant="spinner" size="md" />
        </div>
      </PageContainer>
    );
  }

  if (!vault.data) {
    return (
      <PageContainer maxWidth="6xl">
        <BackLink />
        <div className="rounded-2xl border border-white/5 bg-[#1C1C1C] p-12 text-center">
          <p className="text-lg text-white/40">{t("loadError")}</p>
        </div>
      </PageContainer>
    );
  }

  return <VaultDetail vault={vault.data} />;
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

/** A contract or account id, shortened, linking to the testnet explorer. */
function ExplorerLink({
  kind,
  id,
}: {
  kind: "contract" | "account";
  id: string;
}) {
  return (
    <a
      href={explorerUrl(kind, id)}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 font-mono text-xs hover:underline"
    >
      {id.slice(0, 6)}…{id.slice(-6)}
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

function VaultDetail({ vault }: { vault: ProVault }) {
  const t = useTranslations("sharedPro.detail");
  const tCard = useTranslations("sharedPro.card");
  const tStatus = useTranslations("sharedPro.status");
  const tCategory = useTranslations("sharedPro.categories");
  const tVault = useTranslations(`sharedPro.vaults.${vault.slug}`);
  const format = useFormatter();

  const [investTab, setInvestTab] = useState<InvestTab>("buy");
  const investPanelRef = useRef<HTMLElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [investOpen, setInvestOpen] = useState(false);

  const isFunding = vault.state === "Funding";
  const { address } = useWallet();
  const position = useProBalance(vault.token, address).data ?? 0;
  // Only offer a way out to someone who actually holds the token.
  const canWithdraw = withdrawMethod(vault.state) !== null && position > 0;

  // The Invest / Withdraw buttons toggle the panel on their tab. Opening Buy
  // focuses the amount; on small screens, where the panel stacks below, the
  // page scrolls there.
  const togglePanel = (tab: InvestTab) => {
    if (investOpen && investTab === tab) {
      setInvestOpen(false);
      return;
    }
    setInvestOpen(true);
    setInvestTab(tab);
    requestAnimationFrame(() => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        investPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      if (tab === "buy") amountRef.current?.focus({ preventScroll: true });
    });
  };
  const panelOpenOn = (tab: InvestTab) => investOpen && investTab === tab;

  const Icon = CATEGORY_ICON[vault.category];
  const months = termMonths(vault);
  const targetReturn = format.number(totalReturn(vault), {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const date = (ms: number) =>
    format.dateTime(new Date(ms), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const location = tVault.has("location") ? tVault("location") : null;
  const description = tVault.has("description") ? tVault("description") : "";

  const highlights = [
    t("hlReturn", { pct: targetReturn, count: months }),
    t("hlTranches", {
      count: vault.tranches.length,
      paid: paidTranches(vault),
    }),
    t("hlVerified", { symbol: vault.symbol }),
  ];

  const terms = [
    { label: tCard("targetReturn"), value: targetReturn },
    { label: tCard("term"), value: tCard("months", { count: months }) },
    { label: t("minRaise"), value: usd(vault.minTarget) },
    {
      label: t("tranches"),
      value: t("trancheCount", { count: vault.tranches.length }),
    },
    {
      label: t("exitFee"),
      value: format.number(vault.exitFeeBps / 10_000, {
        style: "percent",
        maximumFractionDigits: 2,
      }),
    },
  ];

  const attributes = [
    { label: tCard("status"), value: tStatus(vault.state) },
    ...(location ? [{ label: t("location"), value: location }] : []),
    { label: t("assetType"), value: tCategory(vault.category) },
    { label: t("token"), value: `${vault.name} (${vault.symbol})` },
    { label: t("tokenStandard"), value: t("tokenStandardValue") },
    { label: t("network"), value: t("networkValue") },
    ...(vault.createdAt
      ? [{ label: t("createdAt"), value: date(vault.createdAt) }]
      : []),
    { label: t("fundingDeadline"), value: date(vault.fundingDeadline) },
    {
      label: t("issuer"),
      value: <ExplorerLink kind="account" id={vault.borrower} />,
    },
    {
      label: t("vaultContract"),
      value: <ExplorerLink kind="contract" id={vault.vault} />,
    },
    {
      label: t("tokenContract"),
      value: <ExplorerLink kind="contract" id={vault.token} />,
    },
    {
      label: t("complianceContract"),
      value: <ExplorerLink kind="contract" id={vault.compliance} />,
    },
    {
      label: t("assetContract", { asset: vault.asset.code }),
      value: <ExplorerLink kind="contract" id={vault.asset.contract} />,
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
          className={`order-last min-w-0 overflow-clip transition-[opacity,translate] duration-500 ease-in-out ${
            investOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0 max-lg:hidden"
          }`}
        >
          <div className="lg:w-[22rem]">
            <InvestPanel
              vault={vault}
              tab={investTab}
              onTabChange={setInvestTab}
              panelRef={investPanelRef}
              amountRef={amountRef}
            />
          </div>
        </div>

        <div className="min-w-0">
          <CurvedPhoto
            src={vault.imageSrc}
            alt={vault.name}
            gradient={vault.gradient}
            fallbackIcon={Icon}
            sizes="(min-width: 1024px) 60vw, 100vw"
            variant="hero"
            framed
            className="h-72 sm:h-60"
          >
            <div className="absolute inset-0 bg-black/45" aria-hidden />

            <div className="absolute top-4 right-6 text-right text-white">
              <p className="text-4xl leading-none font-light tracking-tight sm:text-5xl">
                {targetReturn}
              </p>
              <p className="mt-1.5 text-xs font-medium tracking-wider uppercase">
                {tCard("targetReturn")}
              </p>
            </div>

            {/* Left column sits beside the return and stays above the notch
                (the lower 18% on the left). */}
            <div className="absolute top-4 left-5 max-w-[60%] sm:left-6">
              <h1 className="text-3xl leading-tight font-semibold text-white">
                {vault.name}
              </h1>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/80">
                {description}
              </p>
            </div>
          </CurvedPhoto>

          <section className="relative -mt-4 mb-8 pl-2">
            <h2 className="mb-4 text-2xl font-bold text-white">
              {t("overview")}
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              {t("overviewBody", {
                asset: vault.asset.code,
                name: vault.name,
                symbol: vault.symbol,
                target: usd(vault.target),
                expected: usd(vault.expectedRepayment),
                count: vault.tranches.length,
              })}
            </p>
            {/* Spacing lives on a wrapper: a global stylesheet resets button
                margins, which overrides margin utilities on the button. */}
            <div className="flex flex-wrap items-center gap-3 pt-8">
              {isFunding ? (
                <button
                  type="button"
                  onClick={() => togglePanel("buy")}
                  aria-expanded={panelOpenOn("buy")}
                  aria-controls="pro-invest-panel"
                  className="rounded-lg bg-[#229EDF] px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1a8bc7]"
                >
                  {panelOpenOn("buy") ? t("hideInvest") : t("investCta")}
                </button>
              ) : (
                // Funding is over: say so instead of offering to invest.
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg bg-white/10 px-6 py-2.5 text-sm font-semibold text-white/45"
                >
                  {vault.state === "Failed"
                    ? t("fundingFailed")
                    : t("fundingCompleted")}
                </button>
              )}
              {canWithdraw && (
                <button
                  type="button"
                  onClick={() => togglePanel("withdraw")}
                  aria-expanded={panelOpenOn("withdraw")}
                  aria-controls="pro-invest-panel"
                  className="rounded-lg border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/5"
                >
                  {panelOpenOn("withdraw")
                    ? t("hideWithdraw")
                    : t("withdrawCta")}
                </button>
              )}
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
                    <FundingChart vault={vault} />
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

function Rows({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
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

/** Raised vs target, then each tranche's expected and paid amounts. */
function FundingChart({ vault }: { vault: ProVault }) {
  const t = useTranslations("sharedPro.detail");
  const format = useFormatter();
  const pct = fundedPct(vault);

  const compact = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  // Split "$182.4K" into the figure and its unit so the unit can be dimmed.
  const headline = compact(vault.raised);
  const unitMatch = headline.match(/^(.*?)([A-Za-z]+)$/);
  const figure = unitMatch ? unitMatch[1] : headline;
  const unit = unitMatch ? unitMatch[2] : "";

  const data = vault.tranches.map((tr) => ({
    label: t("trancheLabel", { n: tr.index + 1 }),
    due: format.dateTime(new Date(tr.dueDate), {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    expected: tr.expected,
    paid: tr.paid,
  }));

  return (
    <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-md">
      <p className="text-sm text-white/60">
        {t("totalRaised", { asset: vault.asset.code })}
      </p>
      <p className="mt-1 text-5xl font-light tracking-tight text-white">
        {figure}
        <span className="text-white/40">{unit}</span>
      </p>
      <p className="mt-2 text-sm text-white/50">
        {t("ofTarget", { pct, target: compact(vault.target) })}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">{t("repaymentSchedule")}</p>
        <div className="flex items-center gap-4 text-xs text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white/25" />
            {t("expected")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white" />
            {t("paid")}
          </span>
        </div>
      </div>
      <div className="mt-3 h-56 rounded-2xl bg-white/[0.04]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 0, bottom: 0, left: 0 }}
            barGap={4}
          >
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
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
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v, key) => [
                compact(Number(v)),
                key === "paid" ? t("paid") : t("expected"),
              ]}
              labelFormatter={(_, payload) =>
                payload?.[0]
                  ? `${payload[0].payload.label} · ${payload[0].payload.due}`
                  : ""
              }
              contentStyle={{
                background: "#111111",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "10px",
                color: "white",
              }}
              labelStyle={{ color: "rgba(255,255,255,0.75)" }}
            />
            <Bar
              dataKey="expected"
              fill="rgba(255,255,255,0.25)"
              radius={[6, 6, 0, 0]}
              animationDuration={700}
            />
            <Bar
              dataKey="paid"
              fill="#FFFFFF"
              radius={[6, 6, 0, 0]}
              animationDuration={700}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

type InvestTab = "buy" | "withdraw";

const ASSET_ICON: Record<string, string> = {
  USDC: "/assets/usdc-logo.png",
  USDT0: "/assets/usdt0-logo.png",
};

function InvestPanel({
  vault,
  tab,
  onTabChange,
  panelRef,
  amountRef,
}: {
  vault: ProVault;
  tab: InvestTab;
  onTabChange: (tab: InvestTab) => void;
  panelRef: React.RefObject<HTMLElement | null>;
  amountRef: React.RefObject<HTMLInputElement | null>;
}) {
  const t = useTranslations("sharedPro.detail.invest");
  const tDetail = useTranslations("sharedPro.detail");
  const format = useFormatter();
  const [amountInput, setAmountInput] = useState("");
  const { address } = useWallet();
  const { connect } = useStellarWallet();
  // Balances on the vaults' own network (testnet), for the connected wallet.
  const asset = vault.asset.code;
  const assetBalance = useProBalance(vault.asset.contract, address).data ?? 0;
  const position = useProBalance(vault.token, address).data ?? 0;
  const method = withdrawMethod(vault.state);
  const withdrawValue = useWithdrawValue(vault, address, position).data ?? 0;
  const action = useVaultAction(vault);

  const token = vault.symbol;
  const isBuy = tab === "buy";
  const isFunding = vault.state === "Funding";
  const room = Math.max(0, vault.target - vault.raised);
  // Explain why buying can't work before the user tries.
  const buyBlocker =
    isBuy && address && isFunding && assetBalance === 0 ? "noAsset" : null;

  // Withdrawals always take the whole position, so the field shows it.
  const amount = isBuy ? parseFloat(amountInput) || 0 : position;
  const balance = isBuy ? assetBalance : position;
  const unit = isBuy ? asset : token;
  const hasAmount = amount > 0;
  const exceedsBalance = isBuy && hasAmount && amount > balance + 1e-10;
  const exceedsRoom = isBuy && hasAmount && amount > room + 1e-10;

  const months = termMonths(vault);
  const ret = totalReturn(vault);
  // Spread the term's return evenly over its months.
  const monthly = months > 0 ? (amount * ret) / months : 0;

  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const units = (value: number) =>
    format.number(value, { maximumFractionDigits: 2 });

  const switchTab = (next: InvestTab) => {
    onTabChange(next);
    setAmountInput("");
    action.reset();
  };

  const submit = () =>
    action.mutate(isBuy ? { kind: "invest", amount } : { kind: "withdraw" }, {
      onSuccess: () => setAmountInput(""),
    });

  const canSubmit = isBuy
    ? isFunding && !buyBlocker && hasAmount && !exceedsBalance && !exceedsRoom
    : method !== null && position > 0;

  const buttonLabel = !address
    ? t("connectWallet")
    : action.isPending
      ? t("confirming")
      : isBuy
        ? isFunding
          ? t("buyButton", { token })
          : t("fundingClosed")
        : method
          ? t(`withdrawButtons.${method}`, { token })
          : t("withdrawNotOpen");

  const error =
    action.error instanceof VaultActionError
      ? t(`errors.${action.error.key}`, { detail: action.error.detail ?? "" })
      : action.error
        ? t("errors.failed", { detail: action.error.message })
        : null;

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
            {isBuy
              ? t("buyLabel", { token, asset })
              : t("withdrawLabel", { token })}
          </span>
          {isBuy ? (
            <Image
              src={ASSET_ICON[asset] ?? "/assets/usdc-logo.png"}
              alt={asset}
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
          value={isBuy ? amountInput : units(position)}
          readOnly={!isBuy}
          onChange={(e) => setAmountInput(sanitizeAmountInput(e.target.value))}
          className="mb-3 w-full bg-transparent font-medium text-white outline-none placeholder:text-white/20 read-only:text-white/60"
          style={{
            fontSize: 33,
            fontFamily: '"FK Grotesk", "Inter", sans-serif',
          }}
        />

        <div className="flex items-center justify-between">
          <span
            className={`text-sm tabular-nums ${hasAmount ? "text-white/50" : "text-white/20"}`}
          >
            {usd(isBuy ? amount : withdrawValue)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm tabular-nums text-white/35">
              {units(balance)} {unit}
            </span>
            {isBuy && (
              <button
                type="button"
                onClick={() => setAmountInput(String(Math.min(balance, room)))}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/60 transition-colors hover:bg-white/15"
              >
                {t("max")}
              </button>
            )}
          </div>
        </div>
      </div>

      {buyBlocker && (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs leading-relaxed text-white/70">
          {t(`blockers.${buyBlocker}`, {
            asset,
            assetId: `${asset}:${vault.asset.issuer}`,
          })}
        </p>
      )}

      {!buyBlocker && (exceedsBalance || exceedsRoom) && (
        <p className="px-1 text-xs text-red-400">
          {exceedsBalance
            ? t("insufficientBalance")
            : t("aboveRoom", { room: usd(room) })}
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
              <span className="font-medium text-white/80">
                {tDetail("networkValue")}
              </span>
            </span>
          }
        />
        {isBuy ? (
          <>
            <SummaryRow
              label={t("targetReturn")}
              value={
                <span className="font-semibold text-white">
                  {format.number(ret, {
                    style: "percent",
                    maximumFractionDigits: 2,
                  })}
                </span>
              }
            />
            <SummaryRow
              label={t("projectedMonthly")}
              value={
                <span className="font-semibold text-white">{usd(monthly)}</span>
              }
            />
            <SummaryRow
              label={t("projectedYearly")}
              value={
                <span className="font-semibold text-white">
                  {usd(monthly * 12)}
                </span>
              }
            />
          </>
        ) : (
          <>
            <SummaryRow
              label={t("yourPosition", { token })}
              value={
                <span className="text-white/60">
                  {units(position)} {token}
                </span>
              }
            />
            <SummaryRow
              label={t("youReceive")}
              value={
                <span className="font-semibold text-white">
                  {usd(withdrawValue)}
                </span>
              }
            />
            {method === "early_exit" && (
              <SummaryRow
                label={tDetail("exitFee")}
                value={
                  <span className="text-white/60">
                    {format.number(vault.exitFeeBps / 10_000, {
                      style: "percent",
                      maximumFractionDigits: 2,
                    })}
                  </span>
                }
              />
            )}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={address ? submit : () => void connect()}
        disabled={Boolean(address) && (!canSubmit || action.isPending)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#229EDF] py-3.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#1a8bc7] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {action.isPending && <LoadingSpinner variant="spinner" size="sm" />}
        {buttonLabel}
      </button>

      {error && <p className="px-1 text-xs text-red-400">{error}</p>}
      {action.isSuccess && (
        <p className="px-1 text-xs text-white/60">
          {t(isBuy ? "investDone" : "withdrawDone")}{" "}
          {action.data && (
            <a
              href={`${PRO_NETWORK.explorerBase}/tx/${action.data}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white hover:underline"
            >
              {t("viewTx")}
            </a>
          )}
        </p>
      )}
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
