import { create } from 'zustand';

export type ViewType = 
  | 'graph'
  | 'staging'
  | 'diff'
  | 'branches'
  | 'stashes'
  | 'history'
  | 'blame'
  | 'conflicts'
  | 'search';

export type DiffViewMode = 'unified' | 'split';

interface UIState {
  // View state
  currentView: ViewType;
  sidebarCollapsed: boolean;
  diffViewMode: DiffViewMode;
  
  // Selected items
  selectedFile: string | null;
  selectedStashIndex: number | null;
  
  // Modal/panel state
  isSearchOpen: boolean;
  isCreateBranchOpen: boolean;
  isCommitPanelOpen: boolean;
  
  // Notifications
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  
  // Actions
  setCurrentView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setDiffViewMode: (mode: DiffViewMode) => void;
  selectFile: (file: string | null) => void;
  selectStash: (index: number | null) => void;
  toggleSearch: () => void;
  toggleCreateBranch: () => void;
  toggleCommitPanel: () => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'graph',
  sidebarCollapsed: false,
  diffViewMode: 'unified',
  selectedFile: null,
  selectedStashIndex: null,
  isSearchOpen: false,
  isCreateBranchOpen: false,
  isCommitPanelOpen: true,
  notification: null,

  setCurrentView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setDiffViewMode: (mode) => set({ diffViewMode: mode }),
  selectFile: (file) => set({ selectedFile: file }),
  selectStash: (index) => set({ selectedStashIndex: index }),
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  toggleCreateBranch: () => set((state) => ({ isCreateBranchOpen: !state.isCreateBranchOpen })),
  toggleCommitPanel: () => set((state) => ({ isCommitPanelOpen: !state.isCommitPanelOpen })),
  showNotification: (type, message) => set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),
}));

