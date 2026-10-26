"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  proAccessService,
  type StartedVerification,
  type VerificationKind,
  type VerificationStatus,
} from "../services/proAccess.service";
import {
  loadSession,
  saveSession,
  type VerificationSession,
} from "../utils/verificationSession";
import { isDeadSession, verificationErrorKey } from "../utils/verificationError";
import { proAccessKeys } from "./proAccessKeys";

export type ProVerificationStep = "choose" | "verify" | "approved";

const POLL_MS = 4_000;
const FINAL: ReadonlySet<VerificationStatus> = new Set([
  "approved",
  "declined",
  "expired",
]);

/**
 * Drives the Neko Pro KYC/KYB gate: start a Didit session, poll it until it
 * is final, then whitelist the connected wallet with the approved
 * verification. On success the investor query is primed so the gate opens.
 */
export function useProVerification(wallet: string) {
  const queryClient = useQueryClient();
  // Rendered only after the wallet and access query resolve on the client,
  // so reading sessionStorage in the initializer is safe.
  const [session, setSession] = useState<VerificationSession | null>(
    loadSession
  );

  const verification = useQuery({
    queryKey: proAccessKeys.verification(session?.verificationId ?? null),
    queryFn: () =>
      proAccessService.getVerification(
        session!.verificationId,
        session!.claimToken
      ),
    enabled: Boolean(session),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data && FINAL.has(query.state.data.status) ? false : POLL_MS,
    retry: (count, err) => !isDeadSession(err) && count < 2,
  });

  // `app/didit-callback` posts this from inside the iframe when Didit finishes.
  useEffect(() => {
    if (!session) return;
    const onMessage = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        (event.data as { type?: string })?.type === "didit:complete"
      ) {
        void queryClient.invalidateQueries({
          queryKey: proAccessKeys.verification(session.verificationId),
        });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [session, queryClient]);

  const adopt = useCallback(
    (kind: VerificationKind, started: StartedVerification) => {
      const next: VerificationSession = {
        kind,
        verificationId: started.verification.id,
        claimToken: started.claim_token,
        sessionUrl: started.session_url,
      };
      saveSession(next);
      queryClient.setQueryData(
        proAccessKeys.verification(next.verificationId),
        started.verification
      );
      setSession(next);
    },
    [queryClient]
  );

  const start = useMutation({
    mutationFn: (kind: VerificationKind) =>
      proAccessService.startVerification(kind),
    onSuccess: (started, kind) => adopt(kind, started),
  });

  const startMock = useMutation({
    mutationFn: ({ kind, name }: { kind: VerificationKind; name: string }) =>
      proAccessService.startMockVerification(kind, name),
    onSuccess: (started, { kind }) => adopt(kind, started),
  });

  const whitelist = useMutation({
    mutationFn: (current: VerificationSession) =>
      proAccessService.whitelist(
        current.verificationId,
        current.claimToken,
        wallet
      ),
    onSuccess: (investor) => {
      saveSession(null);
      queryClient.setQueryData(proAccessKeys.investor(wallet), investor);
    },
  });

  const approved = verification.data?.status === "approved";
  const { mutate: bindWallet, isIdle: bindIdle } = whitelist;
  useEffect(() => {
    if (approved && session && bindIdle) bindWallet(session);
  }, [approved, session, bindIdle, bindWallet]);

  const deadSession = isDeadSession(verification.error);

  let step: ProVerificationStep;
  if (!session || deadSession) step = "choose";
  else if (approved) step = "approved";
  else step = "verify";

  const error =
    start.error ??
    startMock.error ??
    whitelist.error ??
    (verification.error && !deadSession ? verification.error : null);

  const reset = useCallback(() => {
    saveSession(null);
    setSession(null);
    start.reset();
    startMock.reset();
    whitelist.reset();
  }, [start, startMock, whitelist]);

  return {
    step,
    session,
    verification: verification.data ?? null,
    busy: start.isPending || startMock.isPending || whitelist.isPending,
    errorKey: error ? verificationErrorKey(error) : null,
    start: (kind: VerificationKind) => start.mutate(kind),
    startMock: (kind: VerificationKind, name: string) =>
      startMock.mutate({ kind, name }),
    checkNow: () => void verification.refetch(),
    /** Re-runs the whitelist (and on-chain registration) after a failure. */
    retryWhitelist: () => whitelist.reset(),
    whitelistFailed: whitelist.isError,
    reset,
  };
}
