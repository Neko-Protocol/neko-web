import type { VaultSnapshot } from "../services/proChain.service";
import { toUnits } from "./amounts";

/** i18n keys under `sharedPro.invest.errors`. */
export type InvestRuleError =
  | "notFunding"
  | "deadlinePassed"
  | "invalidAmount"
  | "belowMinimum"
  | "aboveRemaining"
  | "insufficientBalance";

/**
 * Checked before signing, so the investor sees why instead of a failed
 * simulation: the vault is `Funding`, the deadline has not passed and
 * `min_ticket ≤ amount ≤ target − raised`. The vault itself only enforces
 * the last bound (`TargetExceeded`), so when less than one ticket is left the
 * remainder is still accepted, letting the round fill exactly.
 */
export function checkInvestAmount({
  amount,
  minTicket,
  vault,
  balance,
  now = Date.now(),
}: {
  /** Whole USDC as typed. */
  amount: string;
  /** Whole USDC. */
  minTicket: number;
  vault: VaultSnapshot;
  /** USDC balance in base units. */
  balance: bigint;
  now?: number;
}): InvestRuleError | null {
  if (vault.state !== "Funding") return "notFunding";
  if (BigInt(Math.floor(now / 1000)) > vault.config.funding_deadline) {
    return "deadlinePassed";
  }

  let units: bigint;
  try {
    units = toUnits(amount);
  } catch {
    return "invalidAmount";
  }
  if (units <= 0n) return "invalidAmount";

  const remaining = vault.config.target - vault.raised;
  if (units > remaining) return "aboveRemaining";
  const minimum = toUnits(minTicket);
  if (units < minimum && units !== remaining) return "belowMinimum";
  if (units > balance) return "insufficientBalance";
  return null;
}
