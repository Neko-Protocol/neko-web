import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@defindex/sdk",
    "@neko-protocol/defindex-vault",
    "@neko-protocol/reflector",
    "@neko-protocol/stellar-wallet",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lpvosaigbtcoopfzxhrm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
