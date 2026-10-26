"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import {
  PRIVY_APP_ID,
  PRIVY_CLIENT_ID,
  PRIVY_ENABLED,
} from "@/features/shared/wallet/privy/privyConfig";

export function PrivyAuthProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_ENABLED) return <>{children}</>;

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["email"],
        appearance: {
          theme: "dark",
          accentColor: "#229EDF",
          logo: "/Neko.svg",
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "off" },
          solana: { createOnLogin: "off" },
          showWalletUIs: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
