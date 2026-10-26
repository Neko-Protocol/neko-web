import { contract } from "@stellar/stellar-sdk";
import { PRO_NETWORK } from "../constants/deployments";
import type { ProVault, VaultState } from "../types/vault";
import { read, toUsdc } from "./vaultReader";

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
  if (/Account not found/i.test(message)) {
    return new VaultActionError("accountNotFound");
  }
  if (/reject|declin|cancel/i.test(message)) {
    return new VaultActionError("rejected");
  }
  // Anything else from the token (e.g. an unverified identity) or the wallet.
  return new VaultActionError("failed", message.slice(0, 200));
}

const toUnits = (amount: number) => BigInt(Math.round(amount * 1e7));

/** Simulates, signs and submits one vault call; resolves to the tx hash. */
async function invoke(
  vault: string,
  method: string,
  args: Record<string, unknown>,
  publicKey: string,
  sign: ProSigner
): Promise<string> {
  try {
    const client = (await contract.Client.from({
      contractId: vault,
      rpcUrl: PRO_NETWORK.rpcUrl,
      networkPassphrase: PRO_NETWORK.networkPassphrase,
      publicKey,
      signTransaction: async (xdr: string) => ({
        signedTxXdr: await sign(xdr),
        signerAddress: publicKey,
      }),
    })) as unknown as Record<
      string,
      (
        a: Record<string, unknown>
      ) => Promise<contract.AssembledTransaction<unknown>>
    >;
    const tx = await client[method](args);
    const sent = await tx.signAndSend();
    return sent.sendTransactionResponse?.hash ?? "";
  } catch (err) {
    throw toVaultError(err);
  }
}

/** Deposit `amount` USDC and receive the vault token 1:1. */
export function invest(
  vault: ProVault,
  investor: string,
  amount: number,
  sign: ProSigner
) {
  return invoke(
    vault.vault,
    "invest",
    { investor, amount: toUnits(amount) },
    investor,
    sign
  );
}

/** Exit the whole position the way the vault's state allows. */
export function withdraw(vault: ProVault, investor: string, sign: ProSigner) {
  const method = withdrawMethod(vault.state);
  if (!method) throw new VaultActionError("invalidState");
  return invoke(vault.vault, method, { investor }, investor, sign);
}

/** USDC the investor would receive by withdrawing now. */
export async function withdrawValue(
  vault: ProVault,
  investor: string,
  position: number
): Promise<number> {
  switch (withdrawMethod(vault.state)) {
    case "redeem":
      return toUsdc(await read<bigint>(vault.vault, "claimable", { investor }));
    case "early_exit":
      return toUsdc(
        await read<bigint>(vault.vault, "exit_value", { investor })
      );
    case "refund":
      return position;
    default:
      return 0;
  }
}
