import { privyAuthHeaders } from "@/features/shared/wallet/privy/privySession";
import { backendClient, BackendError } from "./backend-client";
import type { Verification } from "@/features/shared/pro/services/proAccess.service";

/** `GET /v1/launchpad/me`: the Launchpad account behind a Privy login. */
export interface LaunchpadMeResponse {
  account: {
    id: string;
    email: string;
    display_name: string | null;
    privy_user_id: string;
  };
  verification: Verification;
  wallet: {
    address: string;
    network: string;
    funded: boolean;
    funding_tx_hash: string | null;
  };
}

export const launchpadMeApi = {
  /** `null` when this Privy user never created a Launchpad account. */
  get: async (): Promise<LaunchpadMeResponse | null> => {
    try {
      return await backendClient.get<LaunchpadMeResponse>(
        "/v1/launchpad/me",
        { headers: await privyAuthHeaders() }
      );
    } catch (err) {
      if (err instanceof BackendError && err.status === 404) return null;
      throw err;
    }
  },
};
