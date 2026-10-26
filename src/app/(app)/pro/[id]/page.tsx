import type { Metadata } from "next";
import {
  ProAccessGate,
  ProOpportunityDetailPage,
} from "@/features/shared/pro";

export const metadata: Metadata = {
  title: "Pro Opportunity | Neko Protocol",
  description:
    "Target return, terms and contracts of a tokenized Neko Pro vault on Stellar.",
};

export default async function ProOpportunityRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ProAccessGate>
      <ProOpportunityDetailPage id={id} />
    </ProAccessGate>
  );
}
