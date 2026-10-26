import { backendClient } from "@/lib/services/backend-client";

export type LaunchpadAssetType =
  | "real_estate"
  | "agriculture"
  | "energy"
  | "private_credit"
  | "invoices"
  | "other";

/** A Launchpad application whose vault is live on testnet. */
export interface LaunchpadOpportunity {
  id: string;
  asset_name: string;
  asset_type: LaunchpadAssetType | string;
  description: string;
  /** ISO 3166-1 alpha-2. */
  issuer_country: string;
  /** Whole USDC. */
  target_amount: number;
  min_target: number;
  min_ticket: number;
  /** Annual, in percent. */
  expected_yield_pct: number;
  term_months: number;
  token_symbol: string;
  vault: string;
  token: string;
  /** 64 hex characters; the vault's id in the factory and the tracker. */
  vault_id: string;
  /** ISO timestamp. */
  funding_deadline: string;
  milestones: { title: string; amount_pct: number; due: string }[];
  offering_type: string | null;
  investor_countries: string[] | null;
}

/** Addresses the backend derives from the factory; Pro keeps none in env. */
export interface LaunchpadPlatform {
  usdc: string;
  usdc_code: string;
  usdc_issuer: string;
  milestone_tracker: string;
  identity_registry: string;
  network_passphrase: string;
  rpc_url: string;
  horizon_url: string;
}

export interface OpportunitiesResponse {
  items: LaunchpadOpportunity[];
  platform: LaunchpadPlatform;
}

export interface OpportunityResponse {
  item: LaunchpadOpportunity;
  platform: LaunchpadPlatform;
}

/** The faucet's ceiling per request, in whole USDC. */
export const FAUCET_MAX_USDC = 10_000;

class OpportunitiesService {
  list() {
    return backendClient.get<OpportunitiesResponse>(
      "/v1/launchpad/opportunities"
    );
  }

  get(id: string) {
    return backendClient.get<OpportunityResponse>(
      `/v1/launchpad/opportunities/${encodeURIComponent(id)}`
    );
  }

  /**
   * Test USDC from the backend's issuer key. Goes through the backend proxy,
   * which adds the internal key server-side. 409 `TRUSTLINE_MISSING` without
   * a trustline.
   */
  requestTestUsdc(address: string, amount: number) {
    return backendClient.post<{ tx_hash: string }>(
      "/v1/launchpad/faucet/usdc",
      { address, amount }
    );
  }
}

export const opportunitiesService = new OpportunitiesService();
