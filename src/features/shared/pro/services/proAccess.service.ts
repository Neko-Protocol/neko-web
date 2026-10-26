import { backendClient, BackendError } from "@/lib/services/backend-client";

export type VerificationKind = "kyc" | "kyb";
export type VerificationStatus =
  | "pending"
  | "in_progress"
  | "in_review"
  | "approved"
  | "declined"
  | "expired";

export interface Verification {
  id: string;
  kind: VerificationKind;
  provider: "didit" | "mock";
  status: VerificationStatus;
  full_name: string | null;
  business_name: string | null;
  country: string | null;
  claimed: boolean;
}

export interface StartedVerification {
  verification: Verification;
  session_url: string | null;
  claim_token: string;
}

export interface ProInvestor {
  wallet_address: string;
  network: string;
  whitelisted: boolean;
  verification: Verification;
  created_at: string;
}

const claim = (claimToken: string) => ({ "x-claim-token": claimToken });

/**
 * Neko Pro access runs on the backend's Launchpad verification endpoints:
 * a Didit KYC/KYB session, then the approved verification is bound to the
 * connected wallet, which whitelists it for the opportunities.
 */
class ProAccessService {
  /** `null` when the wallet has never been verified. */
  async getInvestor(wallet: string): Promise<ProInvestor | null> {
    try {
      return await backendClient.get<ProInvestor>(
        `/v1/launchpad/investors/${encodeURIComponent(wallet)}`
      );
    } catch (e) {
      if (e instanceof BackendError && e.status === 404) return null;
      throw e;
    }
  }

  startVerification(kind: VerificationKind) {
    return backendClient.post<StartedVerification>(
      "/v1/launchpad/verifications",
      { kind, app: "pro" }
    );
  }

  startMockVerification(kind: VerificationKind, name: string) {
    return backendClient.post<StartedVerification>(
      "/v1/launchpad/verifications/mock",
      { kind, name }
    );
  }

  getVerification(id: string, claimToken: string) {
    return backendClient.get<Verification>(
      `/v1/launchpad/verifications/${encodeURIComponent(id)}`,
      { headers: claim(claimToken) }
    );
  }

  whitelist(verificationId: string, claimToken: string, wallet: string) {
    return backendClient.post<ProInvestor>(
      "/v1/launchpad/investors",
      { verification_id: verificationId, wallet_address: wallet },
      { headers: claim(claimToken) }
    );
  }
}

export const proAccessService = new ProAccessService();
