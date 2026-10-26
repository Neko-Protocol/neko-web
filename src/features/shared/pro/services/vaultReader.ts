import {
  Account,
  Address,
  Contract,
  Keypair,
  TransactionBuilder,
  contract,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import { PRO_NETWORK, PRO_SHARED } from "../constants/deployments";
import {
  FALLBACK_PRESENTATION,
  VAULT_PRESENTATION,
} from "../constants/presentation";
import type {
  ProVault,
  VaultDeployment,
  VaultState,
  VaultTranche,
} from "../types/vault";

/** USDC and every vault token use 7 decimals. */
const DECIMALS = 7;

// Each client fetches its contract's spec from the chain once.
const clients = new Map<string, Promise<contract.Client>>();

function clientFor(contractId: string): Promise<contract.Client> {
  let client = clients.get(contractId);
  if (!client) {
    client = contract.Client.from({
      contractId,
      rpcUrl: PRO_NETWORK.rpcUrl,
      networkPassphrase: PRO_NETWORK.networkPassphrase,
    });
    // Let a failed fetch be retried next time.
    client.catch(() => clients.delete(contractId));
    clients.set(contractId, client);
  }
  return client;
}

/**
 * Runs a read-only method through simulation; nothing is signed or sent.
 * The generated client exposes methods dynamically, hence the index access.
 */
export async function read<T>(
  contractId: string,
  method: string,
  args?: Record<string, unknown>
): Promise<T> {
  const client = (await clientFor(contractId)) as unknown as Record<
    string,
    (a?: Record<string, unknown>) => Promise<{ result: T }>
  >;
  const tx = await client[method](args);
  return tx.result;
}

/** `Buffer` isn't available in the browser; the contract client takes bytes. */
const hexToBytes = (hex: string) =>
  Uint8Array.from(hex.match(/../g) ?? [], (byte) => parseInt(byte, 16));
export const toUsdc = (raw: bigint | number) => Number(raw) / 10 ** DECIMALS;
const toMs = (seconds: bigint | number) => Number(seconds) * 1000;

interface RawConfig {
  usdc: string;
  target: bigint;
  min_target: bigint;
  expected_repayment: bigint;
  funding_deadline: bigint;
  max_exit_fee_bps: number;
}

interface RawTranche {
  index: number;
  expected_amount: bigint;
  paid_amount: bigint;
  due_date: bigint;
  paid_at: bigint;
  evidence_uri: string;
}

interface RawDeployment {
  created_at: bigint;
}

export async function readVault(
  deployment: VaultDeployment
): Promise<ProVault> {
  const { vault, token, vaultId } = deployment;
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
    read<RawConfig>(vault, "get_config"),
    read<{ tag: VaultState }>(vault, "get_state"),
    read<bigint>(vault, "raised"),
    read<bigint>(vault, "repaid"),
    read<number>(vault, "exit_fee"),
    read<RawTranche[]>(vault, "list_tranches"),
    read<string>(token, "name"),
    read<string>(token, "symbol"),
    read<RawDeployment>(PRO_SHARED.factory, "get_deployment", {
      vault_id: hexToBytes(vaultId),
    }).catch(() => null),
  ]);

  return {
    ...deployment,
    ...(VAULT_PRESENTATION[deployment.slug] ?? FALLBACK_PRESENTATION),
    name,
    symbol,
    state: state.tag,
    usdc: config.usdc,
    target: toUsdc(config.target),
    minTarget: toUsdc(config.min_target),
    raised: toUsdc(raised),
    repaid: toUsdc(repaid),
    expectedRepayment: toUsdc(config.expected_repayment),
    fundingDeadline: toMs(config.funding_deadline),
    exitFeeBps: exitFee,
    maxExitFeeBps: config.max_exit_fee_bps,
    tranches: tranches.map((t): VaultTranche => ({
      index: t.index,
      expected: toUsdc(t.expected_amount),
      paid: toUsdc(t.paid_amount),
      dueDate: toMs(t.due_date),
      paidAt: Number(t.paid_at) > 0 ? toMs(t.paid_at) : null,
      evidenceUri: t.evidence_uri,
    })),
    createdAt: record ? toMs(record.created_at) : null,
  };
}

const server = new rpc.Server(PRO_NETWORK.rpcUrl);
// Simulation never checks the source account, so any well-formed key works.
const SIMULATION_SOURCE = new Account(Keypair.random().publicKey(), "0");

/** Simulates one call; `null` when the contract call fails. */
async function simulate(
  contractId: string,
  method: string,
  ...args: xdr.ScVal[]
): Promise<xdr.ScVal | null> {
  const tx = new TransactionBuilder(SIMULATION_SOURCE, {
    fee: "100",
    networkPassphrase: PRO_NETWORK.networkPassphrase,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  return rpc.Api.isSimulationSuccess(sim) && sim.result
    ? sim.result.retval
    : null;
}

/**
 * A SEP-41 balance on the Pro network, in whole units. Simulated directly
 * rather than through `clientFor`: USDC on testnet is a Stellar Asset
 * Contract, which has no wasm to read a spec from.
 */
export async function readBalance(
  tokenContract: string,
  address: string
): Promise<number> {
  const result = await simulate(
    tokenContract,
    "balance",
    new Address(address).toScVal()
  );
  if (!result) throw new Error(`balance() failed on ${tokenContract}`);
  return toUsdc(scValToNative(result) as bigint);
}
