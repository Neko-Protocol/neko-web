import type { VaultPresentation } from "../types/vault";

/**
 * Photo and category for each vault. The contracts hold the money side only;
 * these, plus the copy under `sharedPro.vaults`, are the off-chain dress.
 * Photos are from Unsplash (Unsplash License).
 */
export const VAULT_PRESENTATION: Record<string, VaultPresentation> = {
  "casa-circle": {
    category: "real-estate",
    imageSrc: "/pro/casa-circle.jpg",
    gradient: "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
  },
  "torre-cartago": {
    category: "real-estate",
    imageSrc: "/pro/torre-cartago.jpg",
    gradient: "from-[#3E4A5C] via-[#232A33] to-[#121417]",
  },
};

export const FALLBACK_PRESENTATION: VaultPresentation = {
  category: "private-credit",
  gradient: "from-[#2F4F45] via-[#1E2E29] to-[#111513]",
};
