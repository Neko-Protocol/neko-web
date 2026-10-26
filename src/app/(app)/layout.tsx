import { ReactNode } from "react";
import { WalletAutoConnect } from "@/features/shared/wallet/components/WalletAutoConnect";
import { ConnectWalletModal } from "@/features/shared/wallet/components/ConnectWalletModal";
import { PrivyWalletBridge } from "@/features/shared/wallet/privy/PrivyWalletBridge";
import { PRIVY_ENABLED } from "@/features/shared/wallet/privy/privyConfig";
import { PendingMultisigTxsWatcher } from "@/features/shared/wallet/components/PendingMultisigTxsWatcher";
import { CurrencyRateSync } from "@/features/shared/currency/components/CurrencyRateSync";
import { UIModeModalController } from "@/features/shared/ui-mode/components/UIModeModalController";
import { ConditionalLayout } from "./ConditionalLayout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <WalletAutoConnect />
      {PRIVY_ENABLED && <PrivyWalletBridge />}
      <ConnectWalletModal />
      <PendingMultisigTxsWatcher />
      <CurrencyRateSync />
      <UIModeModalController />
      <ConditionalLayout>{children}</ConditionalLayout>
    </div>
  );
}
