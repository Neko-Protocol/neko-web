"use client";

import React from "react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { CATEGORY_ICON } from "../../constants/categories";
import { PRO_ROUTES } from "../../constants/routes";
import type { ProVault } from "../../types/vault";
import { fundedPct, termMonths, totalReturn } from "../../utils/vaultMath";
import { CurvedPhoto } from "./CurvedPhoto";

/**
 * Top edge of the hover panel in a 340×76 box (stretched to the card width):
 * high on the left, then the photo's S-curve mirrored down on the right.
 */
const PANEL_TOP_PATH =
  "M0,28 Q0,0 28,0 H150 C196,0 194,44 240,44 H330 Q340,44 340,54 V76 H0 Z";

interface VaultCardProps {
  vault: ProVault;
}

export function VaultCard({ vault }: VaultCardProps) {
  const t = useTranslations("sharedPro.card");
  const tStatus = useTranslations("sharedPro.status");
  const tCategory = useTranslations("sharedPro.categories");
  const format = useFormatter();

  const Icon = CATEGORY_ICON[vault.category];
  const description = vault.description;
  const targetReturn = format.number(totalReturn(vault), {
    style: "percent",
    maximumFractionDigits: 1,
  });
  const pct = fundedPct(vault);
  const usd = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  const details = [
    { label: t("term"), value: t("months", { count: termMonths(vault) }) },
    { label: t("status"), value: tStatus(vault.state) },
    { label: t("category"), value: tCategory(vault.category) },
    { label: t("token"), value: vault.symbol },
  ];

  return (
    <Link
      href={PRO_ROUTES.detail(vault.id)}
      className="group relative block h-full outline-none transition-transform duration-300 hover:-translate-y-1"
    >
      <article className="relative z-10 flex h-full flex-col overflow-hidden min-h-72 rounded-[28px] border border-white/10 bg-[#131312] p-2.5 group-focus-visible:border-white/40">
        <CurvedPhoto
          src={vault.imageSrc}
          alt={vault.name}
          gradient={vault.gradient}
          fallbackIcon={Icon}
          sizes="(min-width: 1536px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="h-36"
          imageClassName="transition-transform duration-700 group-hover:scale-105"
        >
          <span className="absolute top-3 left-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur-md">
            <Icon className="h-5 w-5" aria-hidden />
          </span>

          <div className="absolute top-3 right-4 text-right text-white">
            <p className="text-4xl leading-none font-light tracking-tight">
              {targetReturn}
            </p>
            <p className="mt-1 text-[10px] font-medium tracking-wider uppercase">
              {t("targetReturn")}
            </p>
          </div>
        </CurvedPhoto>

        <div className="relative -mt-7 w-1/2 px-3">
          <h3 className="text-xl leading-tight font-semibold text-white">
            {vault.name}
          </h3>
        </div>
        <p className="mt-2 line-clamp-3 px-3 pb-6 text-sm leading-snug text-white/50">
          {description}
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
            <p className="absolute top-5 left-5 right-[46%] z-10 line-clamp-2 text-lg leading-tight font-semibold">
              {vault.name}
            </p>
          </div>

          <div className="relative -mt-7 rounded-b-[28px] bg-white px-5 pt-7 pb-5">
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
                    raised: usd(vault.raised),
                    target: usd(vault.target),
                  })}
                </span>
                <span className="font-semibold">{t("funded", { pct })}</span>
              </div>
              <div
                className="h-1.5 overflow-hidden rounded-full bg-black/10"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#131312]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
