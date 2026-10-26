import { getStellarWalletKit } from "./walletKit";
import { getCurrentNetworkPassphrase } from "../network";

export interface SignStellarTransactionParams {
  unsignedTransactionXdr: string;
  signerPublicKey: string;
  /** Defaults to the app's network; Neko Pro signs for testnet. */
  networkPassphrase?: string;
}

export async function signStellarTransactionWithWallet({
  unsignedTransactionXdr,
  signerPublicKey,
  networkPassphrase = getCurrentNetworkPassphrase(),
}: SignStellarTransactionParams): Promise<string> {
  const Kit = await getStellarWalletKit();

  const { signedTxXdr } = await Kit.signTransaction(unsignedTransactionXdr, {
    address: signerPublicKey,
    networkPassphrase,
  });

  return signedTxXdr;
}
