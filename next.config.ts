import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { buildContentSecurityPolicy, CSP_HEADER } from "./src/lib/security/csp";

const SECURITY_HEADERS = [
  { key: CSP_HEADER, value: buildContentSecurityPolicy() },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: [
    "@defindex/sdk",
    "@neko-protocol/defindex-vault",
    "@neko-protocol/reflector",
    "@neko-protocol/stellar-wallet",
  ],
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
