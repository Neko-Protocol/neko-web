import { Building2, FileText, Sprout, Sun } from "lucide-react";
import type { VaultCategory } from "../types/vault";

export const CATEGORY_ICON: Record<VaultCategory, React.ElementType> = {
  "real-estate": Building2,
  agriculture: Sprout,
  energy: Sun,
  "private-credit": FileText,
};
