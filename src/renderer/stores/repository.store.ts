import { create } from 'zustand';
import type { RepositoryInfo, GitStatus } from '../../shared/types/git.types';

interface RepositoryState {
  // State
  repository: RepositoryInfo | null;
  status: GitStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  openRepository: (path: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  setRepository: (repo: RepositoryInfo | null) => void;
  setStatus: (status: GitStatus | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repository: null,
  status: null,
  isLoading: false,
  error: null,

  openRepository: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.openRepository(path);
      if (response.success) {
        set({ repository: response.data, isLoading: false });
        // Fetch initial status
        await get().refreshStatus();
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  refreshStatus: async () => {
    try {
      const response = await window.electronAPI.git.getStatus();
      if (response.success) {
        set({ status: response.data });
      } else {
        set({ error: response.error });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  setRepository: (repository) => set({ repository }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  reset: () => set({ repository: null, status: null, isLoading: false, error: null }),
}));

