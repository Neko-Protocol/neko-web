import type {
  ActivationPrepareResponse,
  ActivationSubmitResponse,
  BootstrapResponse,
  MeResponse,
  PrepareTransactionResponse,
  TransactionStatusResponse,
  UpdateProfileRequest,
} from "@neko-protocol/api-contracts";
import { privyAuthHeaders } from "@/features/shared/wallet/privy/privySession";
import { backendClient } from "./backend-client";

export type { MeResponse, WalletPublic } from "@neko-protocol/api-contracts";

export const meApi = {
  bootstrap: async () =>
    backendClient.post<BootstrapResponse>(
      "/v1/me/bootstrap",
      {},
      {
        headers: await privyAuthHeaders(),
      }
    ),

  get: async () =>
    backendClient.get<MeResponse>("/v1/me", {
      headers: await privyAuthHeaders(),
    }),

  updateProfile: async (body: UpdateProfileRequest) =>
    backendClient.patch<MeResponse>("/v1/me/profile", body, {
      headers: await privyAuthHeaders(),
    }),

  prepareActivation: async () =>
    backendClient.post<ActivationPrepareResponse>(
      "/v1/me/wallet/activation/prepare",
      {},
      { headers: await privyAuthHeaders() }
    ),

  submitActivation: async (signedXdr: string) =>
    backendClient.post<ActivationSubmitResponse>(
      "/v1/me/wallet/activation/submit",
      { signedXdr },
      { headers: await privyAuthHeaders() }
    ),

  prepareTrustlines: async (assets: string[]) =>
    backendClient.post<ActivationPrepareResponse>(
      "/v1/me/wallet/trustlines/prepare",
      { assets },
      { headers: await privyAuthHeaders() }
    ),

  submitTrustlines: async (signedXdr: string) =>
    backendClient.post<TransactionStatusResponse>(
      "/v1/me/wallet/trustlines/submit",
      { signedXdr },
      { headers: await privyAuthHeaders() }
    ),

  prepareTx: async (unsignedXdr: string) =>
    backendClient.post<PrepareTransactionResponse>(
      "/v1/me/tx/prepare",
      { unsignedXdr },
      { headers: await privyAuthHeaders() }
    ),

  submitTx: async (signedXdr: string) =>
    backendClient.post<TransactionStatusResponse>(
      "/v1/me/tx/submit",
      { signedXdr },
      { headers: await privyAuthHeaders() }
    ),
};
