"use client";

import React, { useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2, FileText, Layers, Sprout, Sun } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  OpportunityCategory,
  ProOpportunity,
} from "../../types/opportunity";

const CATEGORY_ICON: Record<OpportunityCategory, React.ElementType> = {
  "real-estate": Building2,
  agriculture: Sprout,
  energy: Sun,
  "private-credit": FileText,
  other: Layers,
};

/**
 * Photo silhouette in objectBoundingBox units: full width on the right, then
 * a smooth S-curve up to a raised bottom edge on the left, leaving a notch for
 * the title. Corner radii are tuned for the photo's ~2.3:1 aspect ratio.
 */
const PHOTO_CLIP_PATH =
  "M0.07,0 H0.93 Q1,0 1,0.17 V0.83 Q1,1 0.93,1 H0.6 C0.48,1 0.46,0.74 0.34,0.74 H0.07 Q0,0.74 0,0.57 V0.17 Q0,0 0.07,0 Z";

/**
 * Top edge of the hover panel in a 340×76 box (stretched to the card width):
 * high on the left, then the photo's S-curve mirrored down on the right.
 */
const PANEL_TOP_PATH =
  "M0,28 Q0,0 28,0 H150 C196,0 194,44 240,44 H330 Q340,44 340,54 V76 H0 Z";

interface OpportunityCardProps {
  opportunity: ProOpportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const t = useTranslations("sharedPro.card");
  const tCategory = useTranslations("sharedPro.categories");
  const tStatus = useTranslations("sharedPro.status");
  const format = useFormatter();
  // Older React versions return ":r0:"-style ids, invalid inside url(#…).
  const clipId = `pro-photo-${useId().replace(/:/g, "")}`;

  const Icon = CATEGORY_ICON[opportunity.category];
  const apy = format.number(opportunity.targetApy / 100, {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const raisedUsd = opportunity.raisedUsd ?? 0;
  const fundedPct =
    opportunity.targetUsd > 0
      ? Math.min(100, Math.round((raisedUsd / opportunity.targetUsd) * 100))
      : 0;
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const details = [
    { label: t("term"), value: t("months", { count: opportunity.termMonths }) },
    { label: t("minInvestment"), value: usd(opportunity.minInvestmentUsd) },
    { label: t("category"), value: tCategory(opportunity.category) },
    { label: t("token"), value: opportunity.tokenSymbol },
  ];

  return (
    <Link
      href={`/pro/${encodeURIComponent(opportunity.id)}`}
      className="group relative block h-full outline-none transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="relative z-10 flex h-full flex-col overflow-hidden min-h-72 rounded-[28px] border border-white/10 bg-[#131312] p-2.5 group-focus-visible:border-white/40">
        <svg width="0" height="0" className="absolute" aria-hidden>
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={PHOTO_CLIP_PATH} />
            </clipPath>
          </defs>
        </svg>

        <div
          className={cn("relative h-36 bg-linear-to-br", opportunity.gradient)}
          style={{ clipPath: `url(#${clipId})` }}
        >
          {opportunity.imageSrc ? (
            <Image
              src={opportunity.imageSrc}
              alt={opportunity.name}
              fill
              sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <Icon
              className="absolute -right-6 -bottom-6 h-32 w-32 text-white/10"
              aria-hidden
            />
          )}
          <div
            className="absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(0,0,0,0.55)_0%,transparent_70%)]"
            aria-hidden
          />
          {/* A CSS border would ignore the clip-path, so the outline is the
              same path stroked. The clip hides the outer half of the stroke. */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d={PHOTO_CLIP_PATH}
              fill="none"
              stroke="#2B2B2A"
              strokeWidth={4}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <span className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md">
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          {opportunity.status && (
            <span className="absolute top-14 left-3 rounded-full border border-white/30 bg-black/40 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider text-white uppercase backdrop-blur-md">
              {tStatus(opportunity.status)}
            </span>
          )}

          <div className="absolute top-3 right-4 text-right text-white">
            <p className="text-4xl leading-none font-light tracking-tight">
              {apy}
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-wider uppercase">
              {t("targetApy")}
            </p>
          </div>
        </div>

        <div className="relative -mt-7 w-1/2 px-3">
          <h3 className="text-xl leading-tight font-semibold text-white">
            {opportunity.name}
          </h3>
        </div>
        <p className="mt-2 line-clamp-3 px-3 pb-6 text-sm leading-snug text-white/50">
          {opportunity.description}
        </p>

        {/* White lip hugging the bottom edge; a bottom border on a rounded box
            follows the corners up and tapers out. */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[28px] border-b-4 border-[#E8E8E8]"
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 bg-black opacity-0 transition-opacity duration-500 group-hover:opacity-60 group-focus-visible:opacity-60"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 translate-y-full text-[#131312] drop-shadow-[0_-8px_24px_rgba(0,0,0,0.45)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
          <div className="relative">
            <svg
              className="block h-[76px] w-full"
              viewBox="0 0 340 76"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d={PANEL_TOP_PATH} fill="white" />
            </svg>
            <p className="absolute top-6 left-5 text-lg leading-none font-semibold">
              {opportunity.name}
            </p>
          </div>

          <div className="relative -mt-7 rounded-b-[28px] bg-white px-5 pt-6 pb-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              {details.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold tracking-wider text-black/40 uppercase">
                    {label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-bold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-black/60">
                  {t("raised", {
                    raised:
                      opportunity.raisedUsd === null
                        ? "—"
                        : usd(opportunity.raisedUsd),
                    target: usd(opportunity.targetUsd),
                  })}
                </span>
                <span className="font-semibold">
                  {t("funded", { pct: fundedPct })}
                </span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-black/10"
                role="progressbar"
                aria-valuenow={fundedPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#131312]"
                  style={{ width: `${fundedPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
