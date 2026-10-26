import { BackendError } from "@/lib/services/backend-client";
import { ContractCallError } from "../services/proChain.service";

/**
 * Contract codes with copy under `sharedPro.tx.errors`. 1–6 are `VaultError`
 * (contracts/vault); 304 and 321 are the RWA token's identity check
 * (`stellar-tokens` IdentityVerificationFailed / IdentityNotFound), which is
 * where an unverified wallet fails `invest`.
 */
const CONTRACT_CODES: Record<number, string> = {
  1: "invalidState",
  2: "invalidAmount",
  3: "targetExceeded",
  4: "fundingClosed",
  5: "nothingToRedeem",
  6: "insufficientLiquidity",
  304: "notVerifiedOnchain",
  321: "notVerifiedOnchain",
};

const BACKEND_CODES: Record<string, string> = {
  TRUSTLINE_MISSING: "trustlineMissing",
  BACKEND_UNREACHABLE: "backendUnreachable",
};

/** i18n key under `sharedPro.tx.errors`, or `null` for a user rejection. */
export function proTxErrorKey(err: unknown): string | null {
  const message = err instanceof Error ? err.message : String(err);
  // Wallets word a rejected signature differently; none of them is an error.
  if (/USER_REJECTED|user (rejected|declined|denied|cancel)/i.test(message)) {
    return null;
  }
  if (err instanceof ContractCallError) {
    return err.code === null
      ? "txFailed"
      : (CONTRACT_CODES[err.code] ?? "generic");
  }
  if (err instanceof BackendError) return BACKEND_CODES[err.code] ?? "generic";
  if (/passphrase|wrong network|network mismatch/i.test(message)) {
    return "wrongNetwork";
  }
  return "generic";
}
