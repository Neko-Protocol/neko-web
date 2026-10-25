import { Building2, FileText, Sprout, Sun } from "lucide-react";
import type { OpportunityCategory } from "../types/opportunity";

export const CATEGORY_ICON: Record<OpportunityCategory, React.ElementType> = {
  "real-estate": Building2,
  agriculture: Sprout,
  energy: Sun,
  "private-credit": FileText,
};
