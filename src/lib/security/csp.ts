function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const PRIVY = ["https://auth.privy.io", "https://*.privy.io"];
const PRIVY_RPC = ["https://*.rpc.privy.systems"];
const CLOUDFLARE_TURNSTILE = "https://challenges.cloudflare.com";

const WALLETCONNECT_CONNECT = [
  "https://*.walletconnect.com",
  "https://*.walletconnect.org",
  "wss://relay.walletconnect.com",
  "wss://relay.walletconnect.org",
  "wss://www.walletlink.org",
  "https://*.web3modal.com",
  "https://*.web3modal.org",
];
const WALLETCONNECT_FRAMES = [
  "https://verify.walletconnect.com",
  "https://verify.walletconnect.org",
  "https://secure.walletconnect.com",
  "https://secure.walletconnect.org",
];

const STELLAR_WALLET_FRAMES = [
  "https://albedo.link",
  "https://connect.trezor.io",
];

const STELLAR_PUBLIC_RPC = [
  "https://mainnet.sorobanrpc.com",
  "https://soroban-testnet.stellar.org",
  "https://rpc-futurenet.stellar.org",
  "https://horizon.stellar.org",
  "https://horizon-testnet.stellar.org",
  "https://friendbot.stellar.org",
];

export function buildContentSecurityPolicy(): string {
  const isDev = process.env.NODE_ENV !== "production";

  const connectSrc = [
    "'self'",
    ...PRIVY,
    ...PRIVY_RPC,
    ...WALLETCONNECT_CONNECT,
    ...STELLAR_PUBLIC_RPC,
    originOf(process.env.NEXT_PUBLIC_STELLAR_RPC_URL),
    originOf(process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL),
    originOf(process.env.NEXT_PUBLIC_SUPABASE_URL),
    "https://api.frankfurter.dev",
    ...(isDev ? ["ws:"] : []),
  ];

  const directives: Record<string, (string | null)[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...(isDev ? ["'unsafe-eval'"] : []),
      CLOUDFLARE_TURNSTILE,
    ],
    "style-src": [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
    ],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://fonts.reown.com",
    ],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "child-src": [...PRIVY, ...WALLETCONNECT_FRAMES],
    "frame-src": [
      ...PRIVY,
      ...WALLETCONNECT_FRAMES,
      ...STELLAR_WALLET_FRAMES,
      CLOUDFLARE_TURNSTILE,
    ],
    "connect-src": connectSrc,
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "report-uri": ["/api/csp-report"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => {
      const unique = [...new Set(sources.filter((s): s is string => !!s))];
      return `${name} ${unique.join(" ")}`;
    })
    .join("; ");
}

export const CSP_HEADER =
  process.env.CSP_ENFORCE === "true"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";
