"use client";

import { useQuery } from "@tanstack/react-query";
import { opportunitiesService } from "../services/opportunities.service";
import { readMilestones, readVault } from "../services/proChain.service";
import { toProOpportunity } from "../utils/mapOpportunity";
import { proAccessKeys } from "./proAccessKeys";

/**
 * One opportunity for `/pro/[id]`: the backend's terms, the vault's full
 * snapshot (state, raised, tranches) and the tracker's milestones.
 */
export function useProOpportunity(id: string) {
  const offering = useQuery({
    queryKey: proAccessKeys.opportunity(id),
    queryFn: () => opportunitiesService.get(id),
    staleTime: 60_000,
  });
  const item = offering.data?.item ?? null;
  const platform = offering.data?.platform ?? null;

  const vault = useQuery({
    queryKey: proAccessKeys.vault(item?.vault ?? null),
    queryFn: () => readVault(item!.vault),
    enabled: Boolean(item),
    staleTime: 15_000,
  });

  const milestones = useQuery({
    queryKey: proAccessKeys.milestones(item?.vault_id ?? null),
    queryFn: () => readMilestones(platform!.milestone_tracker, item!.vault_id),
    enabled: Boolean(item && platform),
    staleTime: 60_000,
  });

  const snapshot = vault.data ?? null;
  return {
    item,
    platform,
    opportunity: item
      ? toProOpportunity(
          item,
          snapshot ? { state: snapshot.state, raised: snapshot.raised } : null
        )
      : null,
    vault: snapshot,
    milestones: milestones.data ?? null,
    isLoading: offering.isPending,
    isError: offering.isError,
    vaultError: vault.isError,
    milestonesError: milestones.isError,
    refetch: () => {
      void offering.refetch();
      void vault.refetch();
      void milestones.refetch();
    },
  };
}
