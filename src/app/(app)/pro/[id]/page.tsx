import type { Metadata } from "next";
import { ProAccessGate, ProOpportunityDetailPage } from "@/features/shared/pro";

export const metadata: Metadata = {
  title: "Pro Opportunity | Neko Protocol",
  description:
    "Terms, repayment schedule and milestones of a Neko Pro opportunity.",
};

export default function ProOpportunityRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProAccessGate>
      <ProOpportunityDetailPage params={params} />
    </ProAccessGate>
  );
}
