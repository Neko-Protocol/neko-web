import type {
  MeResponse,
  TransactionStatusResponse,
  WalletPublic,
} from "@neko-protocol/api-contracts";
import { meApi } from "@/lib/services/me.api";
import { pollTransactionStatus } from "@/lib/services/transaction.api";
import { BackendError } from "@/lib/services/backend-client";
import { assertActivationOnly } from "@neko-protocol/wallet-core";
import { Asset, TransactionBuilder } from "@stellar/stellar-sdk";
import { getPrivySession, requirePrivySession } from "./privySession";

function primaryWallet(me: MeResponse): WalletPublic | undefined {
  return me.wallets.find((w) => w.is_primary) ?? me.wallets[0];
}

let activating: Promise<WalletPublic> | null = null;

export function ensurePrivyWalletActivated(): Promise<WalletPublic> {
  activating ??= activate().finally(() => {
    activating = null;
  });
  return activating;
}

async function activate(): Promise<WalletPublic> {
  const { wallet } = requirePrivySession();
  const me = await meApi.bootstrap();
  const current = primaryWallet(me);
  if (!current) {
    throw new BackendError(404, { code: "WALLET_NOT_FOUND" }, "No wallet");
  }
  if (current.activation_status === "activated") return current;

  let prepared;
  try {
    prepared = await meApi.prepareActivation();
  } catch (err) {
    if (err instanceof BackendError && err.code === "ALREADY_ACTIVATED") {
      return { ...current, activation_status: "activated" };
    }
    throw err;
  }

  const signedXdr = await wallet.signTransaction(prepared.xdr, {
    networkPassphrase: prepared.network_passphrase,
  });
  const { wallet: activated } = await meApi.submitActivation(signedXdr);
  return activated;
}

const TRUSTLINES_REQUIRED = "TRUSTLINES_REQUIRED";

const SAC_TRUSTLINE_MISSING =
  /contract:(C[A-Z2-7]{55})[^\n]*?trustline entry is missing for account"?,\s*"?(G[A-Z2-7]{55})/g;

function trustlinesNeeded(err: unknown, account: string): string[] | null {
  if (err instanceof BackendError) {
    if (err.code !== TRUSTLINES_REQUIRED) return null;
    const assets = (err.details as { assets?: unknown } | undefined)?.assets;
    return Array.isArray(assets) && assets.length > 0
      ? assets.filter((a): a is string => typeof a === "string")
      : null;
  }
  const message = err instanceof Error ? err.message : String(err);
  const contracts = new Set<string>();
  for (const [, contract, missingFor] of message.matchAll(
    SAC_TRUSTLINE_MISSING
  )) {
    if (missingFor === account) contracts.add(contract);
  }
  return contracts.size > 0 ? [...contracts] : null;
}

const MAX_TRUSTLINE_ROUNDS = 3;

export async function withSponsoredTrustlines<T>(
  run: () => Promise<T>
): Promise<T> {
  const session = getPrivySession();
  if (!session) return run();

  for (let round = 0; ; round++) {
    try {
      return await run();
    } catch (err) {
      const needed = trustlinesNeeded(err, session.wallet.address);
      if (!needed || round >= MAX_TRUSTLINE_ROUNDS) throw err;
      await addSponsoredTrustlines(needed);
    }
  }
}

export async function addSponsoredTrustlines(assets: string[]): Promise<void> {
  if (assets.length === 0) return;
  const { wallet } = requirePrivySession();
  await ensurePrivyWalletActivated();

  let prepared;
  try {
    prepared = await meApi.prepareTrustlines(assets);
  } catch (err) {
    if (err instanceof BackendError && err.code === "TRUSTLINE_EXISTS") return;
    throw err;
  }

  const requested = new Set(assets);
  const tx = TransactionBuilder.fromXDR(
    prepared.xdr,
    prepared.network_passphrase
  );
  const allowedTrustlines = tx.operations.flatMap((op) => {
    if (op.type !== "changeTrust" || !(op.line instanceof Asset)) return [];
    const id = `${op.line.getCode()}:${op.line.getIssuer()}`;
    const sac = op.line.contractId(prepared.network_passphrase);
    return requested.has(id) || requested.has(sac) ? [id] : [];
  });
  assertActivationOnly({
    xdr: prepared.xdr,
    networkPassphrase: prepared.network_passphrase,
    sponsor: prepared.sponsor_address,
    user: wallet.address,
    allowedTrustlines,
  });

  const signedXdr = await wallet.signTransaction(prepared.xdr, {
    networkPassphrase: prepared.network_passphrase,
  });
  let result = await meApi.submitTrustlines(signedXdr);
  if (result.status === "PENDING" || result.status === "NOT_FOUND") {
    result = await pollTransactionStatus(result.hash);
  }
  if (result.status !== "SUCCESS") {
    throw new Error(
      `Couldn't add the trustline (${
        result.error?.message ?? result.error?.code ?? result.status
      })`
    );
  }
}

export async function submitSponsoredTransaction(
  signedXdr: string
): Promise<TransactionStatusResponse> {
  await meApi.prepareTx(signedXdr);
  const result = await meApi.submitTx(signedXdr);
  if (result.status === "PENDING" || result.status === "NOT_FOUND") {
    return pollTransactionStatus(result.hash);
  }
  return result;
}

const NOT_SPONSORABLE = new Set([
  "DISALLOWED_OPERATION",
  "DISALLOWED_CONTRACT",
  "PREPARE_REJECTED",
]);

export async function submitSponsoredTransactionOrThrow(
  signedXdr: string
): Promise<string> {
  let final: TransactionStatusResponse;
  try {
    final = await submitSponsoredTransaction(signedXdr);
  } catch (err) {
    if (err instanceof BackendError && NOT_SPONSORABLE.has(err.code)) {
      throw new Error(
        "Neko can't cover the network fee for this transaction yet. Email accounts support swaps, vaults, lending and liquidity."
      );
    }
    throw err;
  }
  if (final.status !== "SUCCESS") {
    throw new Error(
      `Transaction failed on-chain (${
        final.error?.message ?? final.error?.code ?? final.status
      })`
    );
  }
  return final.hash;
}
