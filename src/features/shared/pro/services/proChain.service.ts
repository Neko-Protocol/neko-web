import {
  Account,
  Address,
  Asset,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Operation,
  rpc,
  scValToNative,
  TransactionBuilder,
  type xdr,
} from "@stellar/stellar-sdk";
import {
  getProHorizonServer,
  getProRpcServer,
  PRO_NETWORK_PASSPHRASE,
} from "../config/proNetwork";
import { toUnits } from "../utils/amounts";

/**
 * Neko vault and milestone-tracker calls on testnet. Reads are simulations:
 * free, unsigned and straight off the ledger, so a page never has to trust
 * the backend for a vault's state. Mirrors `packages/stellar/src/contracts.ts`
 * and `tx.ts` in the tokenization repo; method names and argument types come
 * from `contracts/vault` and `contracts/milestone-tracker`.
 */

// ------------------------------------------------------------------ Arguments

const arg = {
  address: (value: string): xdr.ScVal => Address.fromString(value).toScVal(),
  i128: (value: bigint): xdr.ScVal => nativeToScVal(value, { type: "i128" }),
  /** A `BytesN<32>` given as 64 hex characters. */
  bytes32: (hex: string): xdr.ScVal =>
    nativeToScVal(hexToBytes(hex), { type: "bytes" }),
};

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, "");
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ---------------------------------------------------------------- Simulation

export class ContractCallError extends Error {
  constructor(
    message: string,
    /** The contract's own error code, when the failure was a contract panic. */
    readonly code: number | null
  ) {
    super(message);
    this.name = "ContractCallError";
  }
}

/** Pull `Error(Contract, #n)` out of a simulation or submission failure. */
export function contractErrorCode(message: string): number | null {
  const match = /Error\(Contract, #(\d+)\)/.exec(message);
  return match ? Number(match[1]) : null;
}

/**
 * A simulation is never submitted, so it needs a well-formed source but not
 * a funded one: the all-zero ed25519 key.
 */
const SIMULATION_SOURCE =
  "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

async function readContract<T>(
  contractId: string,
  method: string,
  args: xdr.ScVal[] = []
): Promise<T> {
  const tx = new TransactionBuilder(new Account(SIMULATION_SOURCE, "0"), {
    fee: BASE_FEE,
    networkPassphrase: PRO_NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await getProRpcServer().simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(sim.error, contractErrorCode(sim.error));
  }
  if (!sim.result) {
    throw new ContractCallError(`${method} returned nothing`, null);
  }
  return scValToNative(sim.result.retval) as T;
}

/** A unit enum variant comes back as `["Funding"]`; take the name. */
function variant(value: unknown): string {
  return Array.isArray(value) ? String(value[0]) : String(value);
}

// --------------------------------------------------------------------- Vault

export type VaultState = "Funding" | "Funded" | "Active" | "Settled" | "Failed";

export interface VaultConfig {
  token: string;
  usdc: string;
  borrower: string;
  target: bigint;
  min_target: bigint;
  expected_repayment: bigint;
  /** Unix seconds. */
  funding_deadline: bigint;
  max_exit_fee_bps: number;
  fee_recipient: string;
}

export interface VaultTranche {
  index: number;
  expected_amount: bigint;
  /** Unix seconds. */
  due_date: bigint;
  /** `0` while unpaid. */
  paid_amount: bigint;
  paid_at: bigint;
  evidence_uri: string;
}

export interface VaultSnapshot {
  state: VaultState;
  config: VaultConfig;
  raised: bigint;
  repaid: bigint;
  exitFeeBps: number;
  tranches: VaultTranche[];
}

export async function readVault(vault: string): Promise<VaultSnapshot> {
  const [state, config, raised, repaid, exitFeeBps, tranches] =
    await Promise.all([
      readContract<unknown>(vault, "get_state"),
      readContract<VaultConfig>(vault, "get_config"),
      readContract<bigint>(vault, "raised"),
      readContract<bigint>(vault, "repaid"),
      readContract<number>(vault, "exit_fee"),
      readContract<VaultTranche[]>(vault, "list_tranches"),
    ]);
  return {
    state: variant(state) as VaultState,
    config,
    raised,
    repaid,
    exitFeeBps,
    tranches,
  };
}

/** The two reads the opportunities grid needs, without the tranche list. */
export async function readVaultSummary(
  vault: string
): Promise<{ state: VaultState; raised: bigint }> {
  const [state, raised] = await Promise.all([
    readContract<unknown>(vault, "get_state"),
    readContract<bigint>(vault, "raised"),
  ]);
  return { state: variant(state) as VaultState, raised };
}

export interface VaultPosition {
  /** Vault tokens held; one token per USDC invested. */
  balance: bigint;
  /** What `redeem` pays now (0 before settlement). */
  claimable: bigint;
  /** What `early_exit` pays now, after the exit fee. */
  exitValue: bigint;
}

export async function readVaultPosition(
  vault: string,
  token: string,
  investor: string
): Promise<VaultPosition> {
  const [balance, claimable, exitValue] = await Promise.all([
    // The RWA token names this argument `account`.
    readContract<bigint>(token, "balance", [arg.address(investor)]),
    readContract<bigint>(vault, "claimable", [arg.address(investor)]),
    readContract<bigint>(vault, "exit_value", [arg.address(investor)]),
  ]);
  return { balance, claimable, exitValue };
}

// ----------------------------------------------------------- Milestone tracker

export type MilestoneStatus = "Pending" | "Submitted" | "Approved" | "Rejected";

export interface Milestone {
  index: number;
  title: string;
  evidence_uri: string;
  status: MilestoneStatus;
  /** Unix seconds. */
  updated_at: bigint;
}

export async function readMilestones(
  tracker: string,
  vaultIdHex: string
): Promise<{ milestones: Milestone[]; approved: number }> {
  const [raw, approved] = await Promise.all([
    readContract<(Omit<Milestone, "status"> & { status: unknown })[]>(
      tracker,
      "list_milestones",
      [arg.bytes32(vaultIdHex)]
    ),
    readContract<number>(tracker, "approved_count", [arg.bytes32(vaultIdHex)]),
  ]);
  return {
    milestones: raw.map((m) => ({
      index: m.index,
      title: m.title,
      evidence_uri: m.evidence_uri,
      status: variant(m.status) as MilestoneStatus,
      updated_at: m.updated_at,
    })),
    approved,
  };
}

// ---------------------------------------------------------------- Accounts

export interface UsdcAccount {
  /** The account exists on testnet. */
  exists: boolean;
  /** A trustline to the test USDC issuer is open. */
  trustline: boolean;
  /** USDC balance in base units. */
  balance: bigint;
}

/** Whether a classic account can hold the test USDC, and how much it has. */
export async function readUsdcAccount(
  address: string,
  asset: { code: string; issuer: string }
): Promise<UsdcAccount> {
  try {
    const account = await getProHorizonServer().loadAccount(address);
    const line = account.balances.find(
      (b) =>
        "asset_code" in b &&
        b.asset_code === asset.code &&
        b.asset_issuer === asset.issuer
    );
    return {
      exists: true,
      trustline: Boolean(line),
      // Horizon balances are 7-decimal strings; parsed without floats.
      balance: line ? toUnits(line.balance) : 0n,
    };
  } catch (error) {
    if (
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return { exists: false, trustline: false, balance: 0n };
    }
    throw error;
  }
}

// ------------------------------------------------------------ Transactions

export type InvestorAction = "invest" | "refund" | "early_exit" | "redeem";

/**
 * An investor's vault call, simulated and assembled, as unsigned XDR. The
 * simulation is where an unverified wallet fails: `invest` mints through the
 * token's identity check.
 */
export async function buildVaultInvocation(
  investor: string,
  vault: string,
  action: InvestorAction,
  amount?: bigint
): Promise<string> {
  const args = [arg.address(investor)];
  if (action === "invest") {
    if (amount === undefined) throw new Error("invest needs an amount");
    args.push(arg.i128(amount));
  }

  const server = getProRpcServer();
  const account = await server.getAccount(investor);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PRO_NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(vault).call(action, ...args))
    .setTimeout(120)
    .build();
  try {
    return (await server.prepareTransaction(tx)).toXDR();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ContractCallError(message, contractErrorCode(message));
  }
}

/** A `changeTrust` that lets `source` hold the test USDC, as unsigned XDR. */
export async function buildUsdcTrustline(
  source: string,
  asset: { code: string; issuer: string }
): Promise<string> {
  const account = await getProHorizonServer().loadAccount(source);
  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: PRO_NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({ asset: new Asset(asset.code, asset.issuer) })
    )
    .setTimeout(120)
    .build()
    .toXDR();
}

/** Wait for a sent transaction to land; throws if it failed on-chain. */
export async function waitForProTx(hash: string): Promise<void> {
  const result = await getProRpcServer().pollTransaction(hash, {
    attempts: 30,
    sleepStrategy: () => 1000,
  });
  if (result.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    const detail =
      result.status === rpc.Api.GetTransactionStatus.FAILED
        ? result.resultXdr.result().switch().name
        : result.status;
    throw new ContractCallError(`Transaction failed: ${detail}`, null);
  }
}
