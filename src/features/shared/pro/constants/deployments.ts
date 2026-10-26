import { Networks } from "@stellar/stellar-sdk";
import type { VaultAsset, VaultDeployment } from "../types/vault";

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

/** Assets vaults are denominated in on testnet. */
export const PRO_ASSETS = {
  /** Circle's testnet USDC. */
  circleUsdc: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    contract: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  },
  /** A test USDT0, issued by `issue-asset.sh`. */
  usdt0: {
    code: "USDT0",
    issuer: "GCQ6NGJY742A5JH5O22VANN5VI3WFRFXRVT57XTVTLMHGHPPX3QKGZ7X",
    contract: "CBG2QB3W225KIWSV444WYBVURGLKGNGDOV7SCNLD6GQUREPFT6CMECQ3",
  },
} as const satisfies Record<string, VaultAsset>;

/** Deployed vaults, from neko-tokenization-hackmeridian/deployments/testnet.json. */
export const PRO_VAULTS: VaultDeployment[] = [
  {
    slug: "casa-circle",
    vaultId: "917fb77260548ea0d366b4f03e4fe4e6304aba3dbd10fccaab4c7f7f52e1892e",
    vault: "CDEZ57OJBJOW3LLRJN5VORBTTITMB34WP6J67ELBEJOD33B7PJHE5EM3",
    token: "CC4ZJZCE3VIA3Z5SV3L4YWT3WXFMGYEFTVA4YSHOKM5ASMKTEBGZVKVD",
    compliance: "CD4ZMO2EAGQQ66XD25QU4YJK62AGTMZRY7TKY4UZC5ZTBCHCMIGFXDMY",
    borrower: "GCIGYUUEMKNORCMFDITYQDTFUHMGFFBKQ7PALRKDVGB2YLRUX2P5BH55",
    asset: PRO_ASSETS.circleUsdc,
  },
  {
    slug: "torre-cartago",
    vaultId: "ce851e6e03c9bcbd9428551fa9dbf7c698a8cd78159e0de3168b877f6f7302c4",
    vault: "CDSJN67BXE3YA4QSO5S4XMZ4X5INMLRP2VBKYX2LFK37ALFQEKLNTUDG",
    token: "CABMRVNSDFDZOWFD3LAG5YV7OD5Y5MZKPZGY7PEYPRVD2WVSM4YIJ6GQ",
    compliance: "CCL77RT4HR7TZ5WORHA6QIDRZZCYFQDLHJX3P2UWOY2FYE3MVPAUTLDY",
    borrower: "GBVWIOKZYZKW4MLKF6TOWF4SQKEOISG7HURLYP2EKFRRCYMH2GTIGDF6",
    asset: PRO_ASSETS.usdt0,
  },
];

export function getVaultDeployment(slug: string): VaultDeployment | undefined {
  return PRO_VAULTS.find((v) => v.slug === slug);
}

export const explorerUrl = (kind: "contract" | "account", id: string) =>
  `${PRO_NETWORK.explorerBase}/${kind}/${id}`;
