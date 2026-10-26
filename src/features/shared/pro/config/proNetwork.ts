import { Horizon, Networks, rpc } from "@stellar/stellar-sdk";

/**
 * Neko Pro's own network. The rest of the app runs on mainnet, but every
 * Launchpad vault lives on testnet, so Pro reads, signs and submits against
 * testnet regardless of `NEXT_PUBLIC_STELLAR_NETWORK`. Nothing here is shared
 * with `@/lib/constants/network`.
 */
export const PRO_NETWORK_PASSPHRASE = Networks.TESTNET;

export const PRO_RPC_URL =
  process.env.NEXT_PUBLIC_PRO_STELLAR_RPC_URL ??
  "https://soroban-testnet.stellar.org";

export const PRO_HORIZON_URL =
  process.env.NEXT_PUBLIC_PRO_STELLAR_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

const PRO_EXPLORER_URL = "https://stellar.expert/explorer/testnet";
const PRO_FRIENDBOT_URL = "https://friendbot.stellar.org";

let rpcServer: rpc.Server | null = null;
let horizonServer: Horizon.Server | null = null;

export function getProRpcServer(): rpc.Server {
  rpcServer ??= new rpc.Server(PRO_RPC_URL, {
    allowHttp: !PRO_RPC_URL.startsWith("https:"),
  });
  return rpcServer;
}

export function getProHorizonServer(): Horizon.Server {
  horizonServer ??= new Horizon.Server(PRO_HORIZON_URL, {
    allowHttp: !PRO_HORIZON_URL.startsWith("https:"),
  });
  return horizonServer;
}

export const proExplorer = {
  contract: (id: string) => `${PRO_EXPLORER_URL}/contract/${id}`,
  account: (id: string) => `${PRO_EXPLORER_URL}/account/${id}`,
  tx: (hash: string) => `${PRO_EXPLORER_URL}/tx/${hash}`,
};

export const proFriendbotUrl = (address: string) =>
  `${PRO_FRIENDBOT_URL}/?addr=${encodeURIComponent(address)}`;
