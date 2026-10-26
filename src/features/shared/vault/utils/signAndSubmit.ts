import { TransactionBuilder, rpc } from "@stellar/stellar-sdk";
import { extractSignedTxXdr } from "@neko-protocol/orchestrator";
import { rpcUrl, allowHttpForSoroban } from "@/lib/constants/network";
import { lobstrVaultService } from "@/features/shared/vault/services/lobstr-vault.service";

export type SignAndSubmitResult =
  | {
      kind: "submitted";
      hash: string;
      sendResult: Awaited<ReturnType<rpc.Server["sendTransaction"]>>;
    }
  | { kind: "multisig_pending"; hash: string };

export type SignTransactionFn = (
  xdr: string,
  opts: { networkPassphrase: string; address?: string }
) => Promise<string | { signedTxXdr?: string }>;

/**
 * Signs a prepared transaction and sends it: straight to RPC, or to LOBSTR
 * for co-signing when the wallet is a multisig vault. `server` defaults to the
 * app's configured network; Neko Pro passes its own testnet server.
 */
export async function signAndSubmit(
  xdr: string,
  passphrase: string,
  signFn: SignTransactionFn,
  address: string,
  isMultisig: boolean,
  lobstrRejectedMessage: (error: string) => string,
  server: rpc.Server = new rpc.Server(rpcUrl, {
    allowHttp: allowHttpForSoroban,
  })
): Promise<SignAndSubmitResult> {
  const signed = await signFn(xdr, { networkPassphrase: passphrase, address });
  const signedTxXdr = extractSignedTxXdr(signed);
  const tx = TransactionBuilder.fromXDR(signedTxXdr, passphrase);
  const hash = tx.hash().toString("hex");

  if (isMultisig) {
    const result = await lobstrVaultService.submitForCosigning(signedTxXdr);
    if (!result.ok) {
      throw new Error(lobstrRejectedMessage(result.error));
    }
    return { kind: "multisig_pending", hash };
  }

  const sendResult = await server.sendTransaction(tx);
  return { kind: "submitted", hash, sendResult };
}
