/**
 * Which pages work on the configured network. Neko's vaults, pools, swaps and
 * strategies only exist on mainnet; on testnet only the Dashboard, Neko Pro and
 * Settings (to manage the connected account) are usable.
 */
export const IS_TESTNET =
  (process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET").toUpperCase() ===
  "TESTNET";

export const TESTNET_HOME = "/pro";

const TESTNET_ROUTES = ["/dashboard", "/pro", "/settings"];

export function isRouteAvailable(pathname: string): boolean {
  if (!IS_TESTNET) return true;
  return TESTNET_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}
