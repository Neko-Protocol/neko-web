import { horizonUrl, stellarNetwork } from "@/lib/constants/network";
import { getFriendbotUrl } from "@/lib/helpers/stellar/friendbot";

/** Friendbot only exists off mainnet; there the Privy wallet funds itself. */
export const CAN_FUND_WITH_FRIENDBOT = stellarNetwork !== "PUBLIC";

export async function isAccountFunded(address: string): Promise<boolean> {
  const res = await fetch(
    `${horizonUrl.replace(/\/+$/, "")}/accounts/${encodeURIComponent(address)}`
  );
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Horizon answered ${res.status}`);
  return true;
}

let funding: Promise<boolean> | null = null;

/**
 * Creates the account with friendbot when it doesn't exist on chain yet.
 * Resolves `true` once the account exists. Concurrent calls share one request.
 */
export function ensurePrivyWalletFunded(address: string): Promise<boolean> {
  funding ??= fund(address).finally(() => {
    funding = null;
  });
  return funding;
}

async function fund(address: string): Promise<boolean> {
  if (await isAccountFunded(address)) return true;
  if (!CAN_FUND_WITH_FRIENDBOT) return false;

  const res = await fetch(getFriendbotUrl(address));
  if (res.ok) return true;
  // Friendbot answers 400 op_already_exists when someone else won the race.
  const body = (await res.json().catch(() => ({}))) as {
    detail?: string;
    extras?: { result_codes?: { operations?: string[] } };
  };
  if (
    body.extras?.result_codes?.operations?.includes("op_already_exists") ||
    /already/i.test(body.detail ?? "")
  ) {
    return true;
  }
  throw new Error(`Friendbot answered ${res.status}`);
}
