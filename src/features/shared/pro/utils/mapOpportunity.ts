import type { LaunchpadOpportunity } from "../services/opportunities.service";
import type { VaultState } from "../services/proChain.service";
import type {
  OpportunityCategory,
  OpportunityStatus,
  ProOpportunity,
} from "../types/opportunity";
import { fromUnits } from "./amounts";

const CATEGORY_BY_ASSET_TYPE: Record<string, OpportunityCategory> = {
  real_estate: "real-estate",
  agriculture: "agriculture",
  energy: "energy",
  private_credit: "private-credit",
  invoices: "private-credit",
};

const GRADIENT_BY_CATEGORY: Record<OpportunityCategory, string> = {
  "real-estate": "from-[#3E4A5C] via-[#232A33] to-[#121417]",
  agriculture: "from-[#5B4A2E] via-[#2F2A1C] to-[#151512]",
  energy: "from-[#6B5A1F] via-[#33301A] to-[#141410]",
  "private-credit": "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
  other: "from-[#3B3B3B] via-[#242424] to-[#131313]",
};

export function opportunityStatus(
  state: VaultState,
  fundingDeadline: string,
  now: number = Date.now()
): OpportunityStatus {
  switch (state) {
    case "Funding":
      // The contract closes deposits once the ledger passes the deadline.
      return now <= Date.parse(fundingDeadline) ? "open" : "closed";
    case "Funded":
      return "funded";
    case "Active":
      return "active";
    case "Settled":
      return "settled";
    case "Failed":
      return "failed";
  }
}

export function toProOpportunity(
  item: LaunchpadOpportunity,
  chain: { state: VaultState; raised: bigint } | null
): ProOpportunity {
  const category = CATEGORY_BY_ASSET_TYPE[item.asset_type] ?? "other";
  return {
    id: item.id,
    name: item.asset_name,
    description: item.description,
    category,
    status: chain
      ? opportunityStatus(chain.state, item.funding_deadline)
      : null,
    country: item.issuer_country,
    targetApy: item.expected_yield_pct,
    termMonths: item.term_months,
    minInvestmentUsd: item.min_ticket,
    raisedUsd: chain ? fromUnits(chain.raised) : null,
    targetUsd: item.target_amount,
    minTargetUsd: item.min_target,
    fundingDeadline: item.funding_deadline,
    tokenSymbol: item.token_symbol,
    vault: item.vault,
    token: item.token,
    vaultId: item.vault_id,
    gradient: GRADIENT_BY_CATEGORY[category],
  };
}
