import { useStellarWalletStore } from "@/stores/stellarWalletStore";
import type { RawHashWallet } from "./rawHashWallet";

export const PRIVY_WALLET_NAME = "Privy";

export interface PrivySession {
  wallet: RawHashWallet;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

let session: PrivySession | null = null;

export function setPrivySession(next: PrivySession | null): void {
  session = next;
}

export function getPrivySession(): PrivySession | null {
  return session;
}

export function isPrivyWalletActive(): boolean {
  return useStellarWalletStore.getState().walletName === PRIVY_WALLET_NAME;
}

export function requirePrivySession(): PrivySession {
  if (!session) {
    throw new Error("Your email session has expired. Sign in again.");
  }
  return session;
}

export async function privyAuthHeaders(): Promise<Record<string, string>> {
  const token = await requirePrivySession().getAccessToken();
  if (!token) {
    throw new Error("Your email session has expired. Sign in again.");
  }
  return { Authorization: `Bearer ${token}` };
}
