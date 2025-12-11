import { create } from 'zustand';
import type { RepositoryInfo, GitStatus, RecentRepository } from '../../shared/types/git.types';

const RECENT_REPOS_KEY = 'gitkraken-clone-recent-repos';
const MAX_RECENT_REPOS = 10;

interface RepositoryState {
  // State
  repository: RepositoryInfo | null;
  status: GitStatus | null;
  isLoading: boolean;
  error: string | null;
  recentRepositories: RecentRepository[];

  // Actions
  openRepository: (path: string) => Promise<void>;
  closeRepository: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  setRepository: (repo: RepositoryInfo | null) => void;
  setStatus: (status: GitStatus | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  loadRecentRepositories: () => void;
  addToRecentRepositories: (repo: RecentRepository) => void;
  removeFromRecentRepositories: (path: string) => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repository: null,
  status: null,
  isLoading: false,
  error: null,
  recentRepositories: [],

  openRepository: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.openRepository(path);
      if (response.success) {
        set({ repository: response.data, isLoading: false });
        // Add to recent repositories
        get().addToRecentRepositories({
          path: response.data.path,
          name: response.data.name,
          lastOpened: new Date().toISOString(),
        });
        // Fetch initial status
        await get().refreshStatus();
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  closeRepository: async () => {
    // Always reset the UI state to return to welcome screen
    set({ repository: null, status: null, isLoading: false, error: null });
    // Clean up main process resources (watcher, git service)
    try {
      await window.electronAPI.git.closeRepository();
    } catch {
      // Ignore errors from main process cleanup - UI is already reset
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

  loadRecentRepositories: () => {
    try {
      const stored = localStorage.getItem(RECENT_REPOS_KEY);
      if (stored) {
        const repos: RecentRepository[] = JSON.parse(stored);
        set({ recentRepositories: repos });
      }
    } catch {
      // If parsing fails, start with empty list
      set({ recentRepositories: [] });
    }
  },

  addToRecentRepositories: (repo: RecentRepository) => {
    const { recentRepositories } = get();
    // Remove existing entry with same path (if any)
    const filtered = recentRepositories.filter((r) => r.path !== repo.path);
    // Add new entry at the beginning
    const updated = [repo, ...filtered].slice(0, MAX_RECENT_REPOS);
    set({ recentRepositories: updated });
    // Persist to localStorage
    try {
      localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is not available
    }
  },

  removeFromRecentRepositories: (path: string) => {
    const { recentRepositories } = get();
    const updated = recentRepositories.filter((r) => r.path !== path);
    set({ recentRepositories: updated });
    // Persist to localStorage
    try {
      localStorage.setItem(RECENT_REPOS_KEY, JSON.stringify(updated));
    } catch {
      // Silently fail if localStorage is not available
    }
  },
}));

