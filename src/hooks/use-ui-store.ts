import { create } from "zustand";

interface UIState {
  isNewIssueModalOpen: boolean;
  setNewIssueModalOpen: (open: boolean) => void;
  openNewIssueModal: () => void;
  closeNewIssueModal: () => void;
  
  isNewProjectModalOpen: boolean;
  setNewProjectModalOpen: (open: boolean) => void;
  openNewProjectModal: () => void;
  closeNewProjectModal: () => void;

  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNewIssueModalOpen: false,
  setNewIssueModalOpen: (open) => set({ isNewIssueModalOpen: open }),
  openNewIssueModal: () => set({ isNewIssueModalOpen: true }),
  closeNewIssueModal: () => set({ isNewIssueModalOpen: false }),

  isNewProjectModalOpen: false,
  setNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),
  openNewProjectModal: () => set({ isNewProjectModalOpen: true }),
  closeNewProjectModal: () => set({ isNewProjectModalOpen: false }),

  isCommandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  openCommandPalette: () => set({ isCommandPaletteOpen: true }),
  closeCommandPalette: () => set({ isCommandPaletteOpen: false }),

  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
