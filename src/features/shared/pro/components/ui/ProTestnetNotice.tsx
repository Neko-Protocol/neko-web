"use client";

import React from "react";
import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Pro vaults are on testnet: the wallet has to be switched to sign. */
export function ProTestnetNotice({ className }: { className?: string }) {
  const t = useTranslations("sharedPro.testnet");
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3",
        className
      )}
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400"
        aria-hidden
      />
      <p className="text-sm text-white/70">
        <span className="font-semibold text-white">{t("title")}</span>{" "}
        {t("body")}
      </p>
    </div>
  );
}
