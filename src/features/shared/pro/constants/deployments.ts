import { Networks } from "@stellar/stellar-sdk";

/**
 * Neko Pro vaults run on testnet during HackMeridian, independently of the
 * network the rest of the app uses.
 */
export const PRO_NETWORK = {
  rpcUrl:
    process.env.NEXT_PUBLIC_PRO_STELLAR_RPC_URL ??
    "https://soroban-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  explorerBase: "https://stellar.expert/explorer/testnet",
} as const;

/** Shared contracts, from neko-tokenization-hackmeridian/deployments/testnet.json. */
export const PRO_SHARED = {
  factory: "CC2PULZW3YW3ZRE2Z43RJ5HQDO6L4KAJTDDI5CFMV65662VFAR7F45PC",
} as const;

export const explorerUrl = (kind: "contract" | "account", id: string) =>
  `${PRO_NETWORK.explorerBase}/${kind}/${id}`;
