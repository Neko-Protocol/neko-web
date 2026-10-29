"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { meApi } from "@/lib/services/me.api";
import { BackendError } from "@/lib/services/backend-client";
import { useApiErrorMessage } from "@/lib/helpers/useApiErrorMessage";
import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import { AuthModalShell } from "@/features/shared/wallet/components/AuthModalShell";
import { meQueryKey, useMe } from "./useMe";

const TERMS_VERSION = "2026-10";
const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL?.trim() || null;

export function PrivyProfileModal() {
  const t = useTranslations("common.wallet.profile");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const queryClient = useQueryClient();
  const address = useStellarWalletStore((s) => s.address);
  const { data: me } = useMe();

  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!me || me.account.terms_accepted_at) return null;

  const canSubmit = accepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await meApi.updateProfile({
        terms_version: TERMS_VERSION,
        ...(locale === "en" || locale === "es" ? { locale } : {}),
      });
      queryClient.setQueryData(meQueryKey(address), updated);
    } catch (err) {
      setError(getErrorMessage(err instanceof BackendError ? err.code : null));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthModalShell
      titleId="profile-modal-title"
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <form onSubmit={(e) => void handleSubmit(e)}>
        <label className="flex cursor-pointer items-start gap-3 text-sm text-white/60">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border border-white/25 transition-colors peer-checked:border-[#229EDF] peer-checked:bg-[#229EDF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#229EDF]/50"
          >
            {accepted && (
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            )}
          </span>
          <span className="leading-snug">
            {TERMS_URL
              ? t.rich("termsWithLink", {
                  link: (chunks) => (
                    <a
                      href={TERMS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#229EDF] hover:underline"
                    >
                      {chunks}
                    </a>
                  ),
                })
              : t("terms")}
          </span>
        </label>

        {error && <p className="mt-4 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#229EDF] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a8bc7] disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/30"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("submit")}
        </button>
      </form>
    </AuthModalShell>
  );
}
