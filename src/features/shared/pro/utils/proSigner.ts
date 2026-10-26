import { getStellarWalletKit } from "@/lib/helpers/stellar/wallet";
import {
  isPrivyWalletActive,
  requirePrivySession,
} from "@/features/shared/wallet/privy/privySession";
import { PRO_NETWORK_PASSPHRASE } from "../config/proNetwork";

/**
 * Signs a Pro transaction for testnet. The app's `useWallet().signTransaction`
 * always signs for the app's own (mainnet) passphrase, so Pro passes
 * `Networks.TESTNET` explicitly. Browser wallets must be switched to testnet,
 * or they refuse to sign.
 */
export async function signProTransaction(
  xdr: string,
  { address }: { networkPassphrase: string; address?: string }
): Promise<{ signedTxXdr: string }> {
  if (isPrivyWalletActive()) {
    const signedTxXdr = await requirePrivySession().wallet.signTransaction(
      xdr,
      { networkPassphrase: PRO_NETWORK_PASSPHRASE }
    );
    return { signedTxXdr };
  }

  const Kit = await getStellarWalletKit();
  const { signedTxXdr } = await Kit.signTransaction(xdr, {
    networkPassphrase: PRO_NETWORK_PASSPHRASE,
    address,
  });
  return { signedTxXdr };
}
