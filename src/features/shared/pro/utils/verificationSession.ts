import type { VerificationKind } from "../services/proAccess.service";

/** The in-flight Didit session; the claim token never leaves this tab. */
export interface VerificationSession {
  kind: VerificationKind;
  verificationId: string;
  claimToken: string;
  sessionUrl: string | null;
}

const STORAGE_KEY = "neko.pro.verification";

export function loadSession(): VerificationSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VerificationSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(value: VerificationSession | null) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: the flow still works, it just won't survive a reload.
  }
}
