import { create } from "zustand";

interface ConnectModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useConnectModalStore = create<ConnectModalState>()((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
