import { backendClient, BackendError } from "@/lib/services/backend-client";
import type { VaultCategory, VaultDeployment } from "../types/vault";

type AssetType =
  | "real_estate"
  | "private_credit"
  | "invoices"
  | "agriculture"
  | "energy"
  | "other";

/** `OpportunityView` in neko-backend `domains/launchpad/chain`. */
interface Opportunity {
  id: string;
  asset_type: AssetType;
  description: string;
  issuer_country: string;
  vault: string;
  token: string;
  compliance: string | null;
  vault_id: string;
}

const CATEGORY: Record<AssetType, VaultCategory> = {
  real_estate: "real-estate",
  agriculture: "agriculture",
  energy: "energy",
  private_credit: "private-credit",
  invoices: "private-credit",
  other: "private-credit",
};

const toDeployment = (o: Opportunity): VaultDeployment => ({
  id: o.id,
  vaultId: o.vault_id,
  vault: o.vault,
  token: o.token,
  compliance: o.compliance ?? null,
  description: o.description,
  issuerCountry: o.issuer_country,
  category: CATEGORY[o.asset_type] ?? "private-credit",
});

/**
 * Live vaults come from the backend, which lists approved Launchpad
 * applications whose `launchpad_deployments` row is live. The money side is
 * then read from the chain (`vaultReader`).
 */
class OpportunitiesService {
  async list(): Promise<VaultDeployment[]> {
    const { items } = await backendClient.get<{ items: Opportunity[] }>(
      "/v1/launchpad/opportunities"
    );
    return items.map(toDeployment);
  }

  /** `null` when there is no live vault with that id. */
  async get(id: string): Promise<VaultDeployment | null> {
    try {
      const { item } = await backendClient.get<{ item: Opportunity }>(
        `/v1/launchpad/opportunities/${encodeURIComponent(id)}`
      );
      return toDeployment(item);
    } catch (e) {
      // 400: not a UUID (ParseUUIDPipe); 404: not approved or not live.
      if (e instanceof BackendError && (e.status === 404 || e.status === 400)) {
        return null;
      }
      throw e;
    }
  }
}

export const opportunitiesService = new OpportunitiesService();
