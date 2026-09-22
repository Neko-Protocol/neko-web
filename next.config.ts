import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@defindex/sdk",
    "@neko-protocol/defindex-vault",
    "@neko-protocol/reflector",
    "@neko-protocol/stellar-wallet",
  ],
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
