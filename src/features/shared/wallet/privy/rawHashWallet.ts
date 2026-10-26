import { Buffer } from "buffer";
import { Keypair, TransactionBuilder } from "@stellar/stellar-sdk";

export type RawHashSigner = (hashHex: `0x${string}`) => Promise<string>;

export interface RawHashWallet {
  readonly address: string;
  signTransaction(
    xdr: string,
    options: { networkPassphrase: string }
  ): Promise<string>;
}

function hexToBuffer(hex: string): Buffer {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Signature is not hex");
  }
  return Buffer.from(clean, "hex");
}

/**
 * Stellar wallet over a raw ed25519 hash signer (Privy's `useSignRawHash`).
 * Mirrors `createRawHashWallet` from `@neko-protocol/wallet-core`.
 */
export function createRawHashWallet({
  address,
  signRawHash,
}: {
  address: string;
  signRawHash: RawHashSigner;
}): RawHashWallet {
  return {
    address,
    async signTransaction(xdr, { networkPassphrase }) {
      const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
      const hash = tx.hash();
      const signature = hexToBuffer(
        await signRawHash(`0x${hash.toString("hex")}`)
      );
      if (signature.length !== 64) {
        throw new Error(
          `Expected a 64-byte ed25519 signature, got ${signature.length} bytes`
        );
      }
      if (!Keypair.fromPublicKey(address).verify(hash, signature)) {
        throw new Error("Signature does not match the wallet address");
      }
      tx.addSignature(address, signature.toString("base64"));
      return tx.toXDR();
    },
  };
}
