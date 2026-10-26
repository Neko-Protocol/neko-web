"use client";

import { useQuery } from "@tanstack/react-query";
import { opportunitiesService } from "../services/opportunities.service";
import { readVaultSummary } from "../services/proChain.service";
import { toProOpportunity } from "../utils/mapOpportunity";
import { proAccessKeys } from "./proAccessKeys";

/**
 * Live Launchpad vaults for the Pro grid. The terms come from the backend;
 * the raised amount and the status come from each vault, so a vault whose
 * read fails still lists, without a status.
 */
export function useProOpportunities() {
  const query = useQuery({
    queryKey: proAccessKeys.opportunities(),
    queryFn: async () => {
      const { items, platform } = await opportunitiesService.list();
      const summaries = await Promise.allSettled(
        items.map((item) => readVaultSummary(item.vault))
      );
      return {
        platform,
        items,
        opportunities: items.map((item, i) => {
          const summary = summaries[i];
          return toProOpportunity(
            item,
            summary.status === "fulfilled" ? summary.value : null
          );
        }),
      };
    },
    staleTime: 30_000,
  });

  return {
    opportunities: query.data?.opportunities ?? [],
    items: query.data?.items ?? [],
    platform: query.data?.platform ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: () => void query.refetch(),
  };
}
