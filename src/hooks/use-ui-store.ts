import { create } from "zustand";

interface UIState {
  isNewIssueModalOpen: boolean;
  setNewIssueModalOpen: (open: boolean) => void;
  openNewIssueModal: () => void;
  closeNewIssueModal: () => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNewIssueModalOpen: false,
  setNewIssueModalOpen: (open) => set({ isNewIssueModalOpen: open }),
  openNewIssueModal: () => set({ isNewIssueModalOpen: true }),
  closeNewIssueModal: () => set({ isNewIssueModalOpen: false }),
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
