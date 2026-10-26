import type { VaultPresentation } from "../types/vault";

/**
 * Photo and category for each vault. The contracts hold the money side only;
 * these, plus the copy under `sharedPro.vaults`, are the off-chain dress.
 * Photos are from Unsplash (Unsplash License).
 */
export const VAULT_PRESENTATION: Record<string, VaultPresentation> = {
  "casa-heredia": {
    category: "real-estate",
    imageSrc: "/pro/casa-heredia.jpg",
    gradient: "from-[#3E4A5C] via-[#232A33] to-[#121417]",
  },
  "finca-turrialba": {
    category: "agriculture",
    imageSrc: "/pro/finca-turrialba.jpg",
    gradient: "from-[#5B4A2E] via-[#2F2A1C] to-[#151512]",
  },
};

export const FALLBACK_PRESENTATION: VaultPresentation = {
  category: "private-credit",
  gradient: "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
};
