import { BackendError } from "@/lib/services/backend-client";

/** Backend error codes with copy under `sharedPro.verification.errors`. */
const KNOWN_CODES = new Set([
  "WORKFLOW_NOT_CONFIGURED",
  "VERIFICATION_ALREADY_CLAIMED",
  "WALLET_ALREADY_VERIFIED",
  "VERIFICATION_NOT_APPROVED",
  "CLAIM_TOKEN_INVALID",
  "VERIFICATION_NOT_FOUND",
  "BACKEND_UNREACHABLE",
  "ONCHAIN_IDENTITY_FAILED",
]);

/** i18n key under `sharedPro.verification.errors`. */
export function verificationErrorKey(err: unknown): string {
  if (err instanceof BackendError && KNOWN_CODES.has(err.code)) {
    return err.code;
  }
  return "generic";
}

/** The claim token or verification is gone: the user has to start over. */
export function isDeadSession(err: unknown): boolean {
  return (
    err instanceof BackendError && (err.status === 401 || err.status === 404)
  );
}
