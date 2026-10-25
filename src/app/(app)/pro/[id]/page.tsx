import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProOpportunity,
  ProOpportunityDetailPage,
} from "@/features/shared/pro";

export const metadata: Metadata = {
  title: "Pro Opportunity | Neko Protocol",
  description:
    "Details, target yield and terms of a tokenized Neko Pro opportunity.",
};

export default async function ProOpportunityRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!getProOpportunity(id)) notFound();
  return <ProOpportunityDetailPage id={id} />;
}
