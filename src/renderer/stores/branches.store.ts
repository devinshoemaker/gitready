import { create } from 'zustand';
import type { GitBranch, GitStash, GitMergeResult, GitRebaseResult } from '../../shared/types/git.types';

interface BranchesState {
  // State
  branches: GitBranch[];
  stashes: GitStash[];
  currentBranch: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBranches: () => Promise<void>;
  fetchStashes: () => Promise<void>;
  checkout: (branch: string) => Promise<void>;
  createBranch: (name: string, startPoint?: string) => Promise<void>;
  deleteBranch: (name: string, force?: boolean) => Promise<void>;
  renameBranch: (oldName: string, newName: string) => Promise<void>;
  merge: (branch: string) => Promise<GitMergeResult>;
  rebase: (branch: string) => Promise<GitRebaseResult>;
  stash: (message?: string, includeUntracked?: boolean) => Promise<void>;
  stashApply: (index: number) => Promise<void>;
  stashPop: (index: number) => Promise<void>;
  stashDrop: (index: number) => Promise<void>;
  reset: () => void;
}

export const useBranchesStore = create<BranchesState>((set, get) => ({
  branches: [],
  stashes: [],
  currentBranch: null,
  isLoading: false,
  error: null,

  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.getBranches();
      if (response.success) {
        const current = response.data.find((b) => b.current);
        set({
          branches: response.data,
          currentBranch: current?.name || null,
          isLoading: false,
        });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchStashes: async () => {
    try {
      const response = await window.electronAPI.git.stashList();
      if (response.success) {
        set({ stashes: response.data });
      } else {
        set({ error: response.error });
      }
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  checkout: async (branch: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.checkout(branch);
      if (response.success) {
        set({ currentBranch: branch, isLoading: false });
        await get().fetchBranches();
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createBranch: async (name: string, startPoint?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.createBranch(name, startPoint);
      if (response.success) {
        await get().fetchBranches();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteBranch: async (name: string, force?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.deleteBranch(name, force);
      if (response.success) {
        await get().fetchBranches();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  renameBranch: async (oldName: string, newName: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.renameBranch(oldName, newName);
      if (response.success) {
        await get().fetchBranches();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  merge: async (branch: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.merge(branch);
      set({ isLoading: false });
      if (response.success) {
        return response.data;
      } else {
        set({ error: response.error });
        return { success: false, conflicts: [], message: response.error };
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return { success: false, conflicts: [], message: (error as Error).message };
    }
  },

  rebase: async (branch: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.rebase(branch);
      set({ isLoading: false });
      if (response.success) {
        return response.data;
      } else {
        set({ error: response.error });
        return { success: false, conflicts: [], message: response.error };
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return { success: false, conflicts: [], message: (error as Error).message };
    }
  },

  stash: async (message?: string, includeUntracked?: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.stash({ message, includeUntracked });
      if (response.success) {
        await get().fetchStashes();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  stashApply: async (index: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.stashApply(index);
      if (response.success) {
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  stashPop: async (index: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.stashPop(index);
      if (response.success) {
        await get().fetchStashes();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  stashDrop: async (index: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await window.electronAPI.git.stashDrop(index);
      if (response.success) {
        await get().fetchStashes();
        set({ isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  reset: () => set({ branches: [], stashes: [], currentBranch: null, isLoading: false, error: null }),
}));

