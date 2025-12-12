import { create } from 'zustand';
import type { GitCommit } from '../../shared/types/git.types';
import type { GitLogOptions } from '../../shared/types/ipc.types';
import { APP_CONFIG } from '../../shared/constants';

interface CommitsState {
  // State
  commits: GitCommit[];
  selectedCommit: GitCommit | null;
  selectedCommitFile: string | null;
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;

  // Actions
  fetchCommits: (options?: GitLogOptions) => Promise<void>;
  loadMoreCommits: () => Promise<void>;
  selectCommit: (commit: GitCommit | null) => void;
  selectCommitFile: (file: string | null) => void;
  searchCommits: (query: string, searchIn: 'message' | 'author' | 'hash' | 'all') => Promise<void>;
  reset: () => void;
}

export const useCommitsStore = create<CommitsState>((set, get) => ({
  commits: [],
  selectedCommit: null,
  selectedCommitFile: null,
  isLoading: false,
  hasMore: true,
  error: null,

  fetchCommits: async (options?: GitLogOptions) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.getLog({
        maxCount: APP_CONFIG.MAX_COMMITS_PER_LOAD,
        ...options,
      });
      if (response.success) {
        set({
          commits: response.data,
          hasMore: response.data.length >= APP_CONFIG.MAX_COMMITS_PER_LOAD,
          isLoading: false,
        });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadMoreCommits: async () => {
    const { commits, hasMore, isLoading } = get();
    if (!hasMore || isLoading) return;

    set({ isLoading: true });
    try {
      const response = await window.electronAPI.git.getLog({
        maxCount: APP_CONFIG.MAX_COMMITS_PER_LOAD,
        skip: commits.length,
      });
      if (response.success) {
        set({
          commits: [...commits, ...response.data],
          hasMore: response.data.length >= APP_CONFIG.MAX_COMMITS_PER_LOAD,
          isLoading: false,
        });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  selectCommit: (commit) => set({ selectedCommit: commit, selectedCommitFile: null }),

  selectCommitFile: (file) => set({ selectedCommitFile: file }),

  searchCommits: async (query, searchIn) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.searchCommits({
        query,
        searchIn,
        maxCount: APP_CONFIG.MAX_COMMITS_PER_LOAD,
      });
      if (response.success) {
        set({
          commits: response.data,
          hasMore: false,
          isLoading: false,
        });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  reset: () => set({ commits: [], selectedCommit: null, selectedCommitFile: null, isLoading: false, hasMore: true, error: null }),
}));

