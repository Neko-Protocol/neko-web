import type { Metadata } from "next";
import { ProAccessGate, ProOpportunitiesPage } from "@/features/shared/pro";

export const metadata: Metadata = {
  title: "Pro Opportunities | Neko Protocol",
  description:
    "Tokenized investment opportunities for verified Neko Pro investors.",
};

export default function ProRoute() {
  return (
    <ProAccessGate>
      <ProOpportunitiesPage />
    </ProAccessGate>
  );
}
