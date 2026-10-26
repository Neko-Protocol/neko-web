import { Networks } from "@stellar/stellar-sdk";
import type { VaultDeployment } from "../types/vault";

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
  usdc: "CD5E7LMQ26N2FJMWLBJDVQYDASCP7ENXNFDY2DUXRUD3QJZSZHHMFVT6",
  /** Classic asset behind `usdc`; wallets need a trustline to it. */
  usdcAsset: "USDC:GC6KXTKOPEZJEVPZZT37GAIYFYX5WVQVC5NJWOHMCOLWSSOFFT6NZNS3",
} as const;

/** Deployed vaults, from neko-tokenization-hackmeridian/deployments/testnet.json. */
export const PRO_VAULTS: VaultDeployment[] = [
  {
    slug: "casa-heredia",
    vaultId: "8490dfb820e4d4470aa56d05168d95980a7538109ee0070adcb11c2aaf81fe11",
    vault: "CDN5CN74UXZSML6B533RX734VHWOGYNQM74I66OODXGM3XXD2STA3TNX",
    token: "CA5OC5UFQ567YODR5M6HPMYRQQW76ALIVELF3PWAUB5KV345FDCOXMJ5",
    compliance: "CC7XANOTGZZ4JC34WHDW5BJBSNVO6AMHO2EMRT2MLDYL5ELJFEV4XYBQ",
    borrower: "GAVG4JF4XV6EUQIOX72PTSJDLFJARQ26RVFVD5DDBT3N6CBZFIDDYCJ5",
  },
  {
    slug: "finca-turrialba",
    vaultId: "ed9e44b577c8d9684c03dea7a3ecebac0a33caf5711de382a44a2383e7d245ae",
    vault: "CD5AHZR3YD6T4OZJNNBWVTSMWTP6U7FV44BHEPFPOJMVNUKTEH4F7XDJ",
    token: "CB7SLOQT7N7YFS2M7ROS6I6JCYKQINZQ4ZU7LF42TSX6CRQC4X4ZER2W",
    compliance: "CD6EZOSIIIOQMSLDSSIL2BRWPVNQEN3WHMBMT7DHVP5DJ2SBRR6BWMJT",
    borrower: "GCEWERAKURSP2OKU73YUNKT7GILR7PFX2SV66ELR6IDAJAT6GXJQGYL4",
  },
];

export function getVaultDeployment(slug: string): VaultDeployment | undefined {
  return PRO_VAULTS.find((v) => v.slug === slug);
}

export const explorerUrl = (kind: "contract" | "account", id: string) =>
  `${PRO_NETWORK.explorerBase}/${kind}/${id}`;
