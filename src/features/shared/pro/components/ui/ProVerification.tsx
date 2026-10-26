"use client";

import React, { useState } from "react";
import { Building2, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils";
import { useProVerification } from "../../hooks/useProVerification";
import { PRO_SPINNER, PRO_SPINNER_DARK } from "./proSpinner";
import type {
  VerificationKind,
  VerificationStatus,
} from "../../services/proAccess.service";

const MOCK_ENABLED = process.env.NEXT_PUBLIC_KYC_MOCK_ENABLED === "true";

const WAITING: ReadonlySet<VerificationStatus> = new Set([
  "pending",
  "in_progress",
  "in_review",
]);

const KINDS: { kind: VerificationKind; icon: typeof User }[] = [
  { kind: "kyc", icon: User },
  { kind: "kyb", icon: Building2 },
];

export function ProVerification({ wallet }: { wallet: string }) {
  const t = useTranslations("sharedPro.verification");
  const flow = useProVerification(wallet);
  const [kind, setKind] = useState<VerificationKind>("kyc");
  const status = flow.verification?.status ?? "pending";

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/5 bg-[#1C1C1C] p-6 sm:p-8">
      {flow.errorKey && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {t(`errors.${flow.errorKey}`)}
        </p>
      )}

      {flow.step === "choose" && (
        <>
          <Heading title={t("choose.title")} body={t("choose.body")} />
          <div role="radiogroup" className="flex flex-col gap-2">
            {KINDS.map(({ kind: option, icon: Icon }) => {
              const active = kind === option;
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setKind(option)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 text-left transition-colors",
                    active
                      ? "border-[#229EDF] bg-[#2A2A2A]"
                      : "border-white/5 bg-[#2A2A2A] hover:border-white/15"
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <Icon className="h-5 w-5 text-white/80" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">
                      {t(`kinds.${option}.title`)}
                    </span>
                    <span className="block text-xs text-white/45">
                      {t(`kinds.${option}.body`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <PrimaryButton busy={flow.busy} onClick={() => flow.start(kind)}>
            {t("choose.cta")}
          </PrimaryButton>
        </>
      )}

      {flow.step === "verify" && (
        <>
          <Heading
            title={t(`verify.title.${flow.session?.kind ?? kind}`)}
            body={t("verify.body")}
          />
          {flow.session?.sessionUrl ? (
            <iframe
              title={t("verify.iframeTitle")}
              src={flow.session.sessionUrl}
              allow="camera; microphone; fullscreen; autoplay; encrypted-media"
              className="h-[560px] w-full rounded-2xl border border-white/10 bg-white"
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-2xl bg-[#2A2A2A]">
              <LoadingSpinner className={PRO_SPINNER} />
            </div>
          )}
          <div className="flex items-center justify-center gap-2 text-center text-xs text-white/55">
            {WAITING.has(status) && (
              <LoadingSpinner
                size="sm"
                className={cn("h-3 w-3", PRO_SPINNER)}
              />
            )}
            {t(`status.${status}`)}
          </div>
          <div className="flex justify-center gap-5 text-xs">
            {WAITING.has(status) && (
              <button
                type="button"
                onClick={flow.checkNow}
                className="font-semibold text-white hover:underline"
              >
                {t("verify.checkNow")}
              </button>
            )}
            <button
              type="button"
              onClick={flow.reset}
              className="text-white/50 hover:text-white"
            >
              {t("verify.startOver")}
            </button>
          </div>
        </>
      )}

      {flow.step === "approved" && (
        <>
          <Heading
            title={t("approved.title")}
            body={
              flow.verification?.business_name ??
              flow.verification?.full_name ??
              t("approved.body")
            }
          />
          {flow.errorKey ? (
            <div className="flex items-center justify-center gap-4">
              {flow.whitelistFailed && (
                <button
                  type="button"
                  onClick={flow.retryWhitelist}
                  className="text-xs text-white hover:text-white/80"
                >
                  {t("approved.retry")}
                </button>
              )}
              <button
                type="button"
                onClick={flow.reset}
                className="text-xs text-white/50 hover:text-white"
              >
                {t("verify.startOver")}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-xs text-white/55">
              <LoadingSpinner
                size="sm"
                className={cn("h-3 w-3", PRO_SPINNER)}
              />
              {t("approved.unlocking")}
            </div>
          )}
        </>
      )}

      {MOCK_ENABLED && flow.step !== "approved" && (
        <DemoSkip
          kind={flow.session?.kind ?? kind}
          busy={flow.busy}
          onSkip={(skipKind, name) => {
            flow.reset();
            flow.startMock(skipKind, name);
          }}
        />
      )}
    </div>
  );
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-center">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-white/50">{body}</p>
    </div>
  );
}

function PrimaryButton({
  busy,
  onClick,
  children,
}: {
  busy: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {busy && (
        <LoadingSpinner
          size="sm"
          className={cn("h-4 w-4", PRO_SPINNER_DARK)}
        />
      )}
      {children}
    </button>
  );
}

/** Demo only (NEXT_PUBLIC_KYC_MOCK_ENABLED): records an approved mock verification. */
function DemoSkip({
  kind,
  busy,
  onSkip,
}: {
  kind: VerificationKind;
  busy: boolean;
  onSkip: (kind: VerificationKind, name: string) => void;
}) {
  const t = useTranslations("sharedPro.verification.demo");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const placeholder = t(`placeholder.${kind}`);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-center text-xs text-white/35 hover:text-white/70"
      >
        {t("open")}
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSkip(kind, name.trim() || placeholder);
      }}
      className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#2A2A2A]/60 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{t("title")}</p>
          <p className="mt-1 text-xs text-white/45">
            {t(`description.${kind}`)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
          className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          aria-label={t("nameLabel")}
          autoFocus
          className="h-10 w-full rounded-full border border-white/10 bg-[#1C1C1C] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/25"
        />
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#121212] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy && (
            <LoadingSpinner
              size="sm"
              className={cn("h-4 w-4", PRO_SPINNER_DARK)}
            />
          )}
          {t("skip")}
        </button>
      </div>
    </form>
  );
}
