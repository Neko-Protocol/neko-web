"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { isRouteAvailable, TESTNET_HOME } from "@/lib/constants/networkAccess";

/** Replaces mainnet-only pages with a notice when the app runs on testnet. */
export function TestnetRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("common.testnet");

  if (isRouteAvailable(pathname ?? "")) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-md flex-col justify-center px-4 lg:min-h-[calc(100dvh-5rem)]">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/5 bg-[#1C1C1C] p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10">
          <Globe className="h-6 w-6 text-yellow-400" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-white">
            {t("unavailableTitle")}
          </h2>
          <p className="mt-1 text-sm text-white/50">{t("unavailableBody")}</p>
        </div>
        <Link
          href={TESTNET_HOME}
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90"
        >
          {t("goToPro")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
