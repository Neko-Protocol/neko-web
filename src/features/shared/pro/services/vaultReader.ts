import { Buffer } from "buffer";
import { Client as FactoryClient } from "@/lib/contracts/neko-tokenization/factory";
import { Client as TokenClient } from "@/lib/contracts/neko-tokenization/token";
import { Client as VaultClient } from "@/lib/contracts/neko-tokenization/vault";
import { PRO_NETWORK, PRO_SHARED } from "../constants/deployments";
import {
  FALLBACK_PRESENTATION,
  VAULT_PRESENTATION,
} from "../constants/presentation";
import type { ProVault, VaultDeployment, VaultTranche } from "../types/vault";

/** Every classic asset and every vault token uses 7 decimals. */
const DECIMALS = 7;

const options = (contractId: string) => ({
  contractId,
  rpcUrl: PRO_NETWORK.rpcUrl,
  networkPassphrase: PRO_NETWORK.networkPassphrase,
});

// The generated clients carry their contract's spec, so building one is free;
// reads simulate and never sign.
export const vaultClient = (id: string) => new VaultClient(options(id));
const tokenClient = (id: string) => new TokenClient(options(id));
const factory = new FactoryClient(options(PRO_SHARED.factory));

export const toUnits = (raw: bigint | number) => Number(raw) / 10 ** DECIMALS;
const toMs = (seconds: bigint | number) => Number(seconds) * 1000;

export async function readVault(
  deployment: VaultDeployment
): Promise<ProVault> {
  const vault = vaultClient(deployment.vault);
  const token = tokenClient(deployment.token);
  const [
    config,
    state,
    raised,
    repaid,
    exitFee,
    tranches,
    name,
    symbol,
    record,
  ] = await Promise.all([
    vault.get_config().then((t) => t.result),
    vault.get_state().then((t) => t.result),
    vault.raised().then((t) => t.result),
    vault.repaid().then((t) => t.result),
    vault.exit_fee().then((t) => t.result),
    vault.list_tranches().then((t) => t.result),
    token.name().then((t) => t.result),
    token.symbol().then((t) => t.result),
    factory
      .get_deployment({ vault_id: Buffer.from(deployment.vaultId, "hex") })
      .then((t) => t.result)
      .catch(() => null),
  ]);

  return {
    ...deployment,
    ...(VAULT_PRESENTATION[deployment.slug] ?? FALLBACK_PRESENTATION),
    // The vault's config is the source of truth for what it accepts.
    asset: { ...deployment.asset, contract: config.usdc },
    name,
    symbol,
    state: state.tag,
    target: toUnits(config.target),
    minTarget: toUnits(config.min_target),
    raised: toUnits(raised),
    repaid: toUnits(repaid),
    expectedRepayment: toUnits(config.expected_repayment),
    fundingDeadline: toMs(config.funding_deadline),
    exitFeeBps: exitFee,
    maxExitFeeBps: config.max_exit_fee_bps,
    tranches: tranches.map((t): VaultTranche => ({
      index: t.index,
      expected: toUnits(t.expected_amount),
      paid: toUnits(t.paid_amount),
      dueDate: toMs(t.due_date),
      paidAt: Number(t.paid_at) > 0 ? toMs(t.paid_at) : null,
      evidenceUri: t.evidence_uri,
    })),
    createdAt: record ? toMs(record.created_at) : null,
  };
}

/**
 * A SEP-41 balance in whole units. Works for vault tokens and for the Stellar
 * Asset Contracts vaults are denominated in, which share `balance(id)`.
 */
export async function readBalance(
  tokenContract: string,
  address: string
): Promise<number> {
  const { result } = await tokenClient(tokenContract).balance({
    account: address,
  });
  return toUnits(result);
}
