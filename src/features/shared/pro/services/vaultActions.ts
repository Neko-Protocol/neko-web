import { Client as VaultClient } from "@/lib/contracts/neko-tokenization/vault";
import { PRO_NETWORK } from "../constants/deployments";
import type { ProVault, VaultState } from "../types/vault";
import { toUnits, vaultClient } from "./vaultReader";

/** Signs an XDR for the Pro network with the connected wallet. */
export type ProSigner = (xdr: string) => Promise<string>;

/** How a holder gets out, by vault state; `null` while there's no way out. */
export type WithdrawMethod = "refund" | "early_exit" | "redeem";

export function withdrawMethod(state: VaultState): WithdrawMethod | null {
  switch (state) {
    case "Failed":
      return "refund";
    case "Active":
      return "early_exit";
    case "Settled":
      return "redeem";
    default:
      return null;
  }
}

/** Vault errors from `contracts/vault`, as i18n keys. */
const VAULT_ERRORS: Record<number, string> = {
  1: "invalidState",
  2: "invalidAmount",
  3: "targetExceeded",
  4: "fundingClosed",
  5: "nothingToRedeem",
  6: "insufficientLiquidity",
};

/** `IdentityNotFound` from the identity registry (stellar-tokens RWA). */
const IDENTITY_NOT_FOUND = 321;

/** Thrown with an i18n key under `sharedPro.detail.invest.errors`. */
export class VaultActionError extends Error {
  constructor(
    readonly key: string,
    readonly detail?: string
  ) {
    super(detail ?? key);
  }
}

function toVaultError(err: unknown): VaultActionError {
  const message = err instanceof Error ? err.message : String(err);
  const code = message.match(/Error\(Contract, #(\d+)\)/)?.[1];
  if (code && VAULT_ERRORS[Number(code)]) {
    return new VaultActionError(VAULT_ERRORS[Number(code)]);
  }
  if (Number(code) === IDENTITY_NOT_FOUND) {
    return new VaultActionError("identityNotRegistered");
  }
  if (/Account not found/i.test(message)) {
    return new VaultActionError("accountNotFound");
  }
  if (/reject|declin|cancel/i.test(message)) {
    return new VaultActionError("rejected");
  }
  // Anything else from the token (e.g. an unverified identity) or the wallet.
  return new VaultActionError("failed", message.slice(0, 200));
}

const toRaw = (amount: number) => BigInt(Math.round(amount * 1e7));

/** A vault client that signs with the connected wallet. */
const signingVault = (vault: string, publicKey: string, sign: ProSigner) =>
  new VaultClient({
    contractId: vault,
    rpcUrl: PRO_NETWORK.rpcUrl,
    networkPassphrase: PRO_NETWORK.networkPassphrase,
    publicKey,
    signTransaction: async (xdr: string) => ({
      signedTxXdr: await sign(xdr),
      signerAddress: publicKey,
    }),
  });

/** Simulates, signs and submits; resolves to the transaction hash. */
async function send(
  build: () => Promise<{
    signAndSend: () => Promise<{ sendTransactionResponse?: { hash: string } }>;
  }>
): Promise<string> {
  try {
    const tx = await build();
    const sent = await tx.signAndSend();
    return sent.sendTransactionResponse?.hash ?? "";
  } catch (err) {
    throw toVaultError(err);
  }
}

/** Deposit `amount` of the vault's asset and receive its token 1:1. */
export function invest(
  vault: ProVault,
  investor: string,
  amount: number,
  sign: ProSigner
) {
  const client = signingVault(vault.vault, investor, sign);
  return send(() => client.invest({ investor, amount: toRaw(amount) }));
}

/** Exit the whole position the way the vault's state allows. */
export function withdraw(vault: ProVault, investor: string, sign: ProSigner) {
  const client = signingVault(vault.vault, investor, sign);
  switch (withdrawMethod(vault.state)) {
    case "redeem":
      return send(() => client.redeem({ investor }));
    case "early_exit":
      return send(() => client.early_exit({ investor }));
    case "refund":
      return send(() => client.refund({ investor }));
    default:
      throw new VaultActionError("invalidState");
  }
}

/** What the investor would receive by withdrawing now, in the vault's asset. */
export async function withdrawValue(
  vault: ProVault,
  investor: string,
  position: number
): Promise<number> {
  const client = vaultClient(vault.vault);
  switch (withdrawMethod(vault.state)) {
    case "redeem":
      return toUnits((await client.claimable({ investor })).result);
    case "early_exit":
      return toUnits((await client.exit_value({ investor })).result);
    case "refund":
      return position;
    default:
      return 0;
  }
}
