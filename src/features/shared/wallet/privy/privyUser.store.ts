import { create } from "zustand";

/** Profile of the signed-in Privy user; set by `PrivyWalletBridge`. */
interface PrivyUserState {
  email: string | null;
  setEmail: (email: string | null) => void;
}

export const usePrivyUserStore = create<PrivyUserState>()((set) => ({
  email: null,
  setEmail: (email) => set({ email }),
}));
