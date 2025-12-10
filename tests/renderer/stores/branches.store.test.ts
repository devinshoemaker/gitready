import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import type { GitBranch, GitStash } from '../../../src/shared/types/git.types';

const createMockBranch = (name: string, current = false, isRemote = false): GitBranch => ({
  name,
  current,
  commit: 'abc123',
  isRemote,
});

describe('useBranchesStore', () => {
  beforeEach(() => {
    useBranchesStore.setState({
      branches: [],
      stashes: [],
      currentBranch: null,
      isLoading: false,
      error: null,
    });

    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useBranchesStore.getState();

      expect(state.branches).toEqual([]);
      expect(state.stashes).toEqual([]);
      expect(state.currentBranch).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchBranches', () => {
    it('should fetch and set branches', async () => {
      const mockBranches: GitBranch[] = [
        createMockBranch('main', true),
        createMockBranch('develop'),
        createMockBranch('origin/main', false, true),
      ];

      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({
        success: true,
        data: mockBranches,
      });

      await useBranchesStore.getState().fetchBranches();

      const state = useBranchesStore.getState();
      expect(state.branches).toHaveLength(3);
      expect(state.currentBranch).toBe('main');
    });

    it('should set error on failure', async () => {
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({
        success: false,
        error: 'Branch error',
      });

      await useBranchesStore.getState().fetchBranches();

      expect(useBranchesStore.getState().error).toBe('Branch error');
    });
  });

  describe('fetchStashes', () => {
    it('should fetch and set stashes', async () => {
      const mockStashes: GitStash[] = [
        { index: 0, hash: 'abc123', message: 'WIP', date: '2024-01-01' },
      ];

      window.electronAPI.git.stashList = vi.fn().mockResolvedValue({
        success: true,
        data: mockStashes,
      });

      await useBranchesStore.getState().fetchStashes();

      expect(useBranchesStore.getState().stashes).toEqual(mockStashes);
    });
  });

  describe('checkout', () => {
    it('should checkout branch and refresh', async () => {
      window.electronAPI.git.checkout = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({
        success: true,
        data: [createMockBranch('develop', true)],
      });

      await useBranchesStore.getState().checkout('develop');

      expect(window.electronAPI.git.checkout).toHaveBeenCalledWith('develop');
      expect(useBranchesStore.getState().currentBranch).toBe('develop');
    });

    it('should set error on failure', async () => {
      window.electronAPI.git.checkout = vi.fn().mockResolvedValue({
        success: false,
        error: 'Cannot checkout',
      });

      await useBranchesStore.getState().checkout('locked-branch');

      expect(useBranchesStore.getState().error).toBe('Cannot checkout');
    });
  });

  describe('createBranch', () => {
    it('should create branch and refresh', async () => {
      window.electronAPI.git.createBranch = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({
        success: true,
        data: [createMockBranch('new-feature', true)],
      });

      await useBranchesStore.getState().createBranch('new-feature');

      expect(window.electronAPI.git.createBranch).toHaveBeenCalledWith('new-feature', undefined);
    });

    it('should create branch from start point', async () => {
      window.electronAPI.git.createBranch = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

      await useBranchesStore.getState().createBranch('feature', 'develop');

      expect(window.electronAPI.git.createBranch).toHaveBeenCalledWith('feature', 'develop');
    });
  });

  describe('deleteBranch', () => {
    it('should delete branch and refresh', async () => {
      useBranchesStore.setState({ branches: [createMockBranch('old-feature')] });

      window.electronAPI.git.deleteBranch = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

      await useBranchesStore.getState().deleteBranch('old-feature');

      expect(window.electronAPI.git.deleteBranch).toHaveBeenCalledWith('old-feature', undefined);
    });

    it('should force delete branch', async () => {
      window.electronAPI.git.deleteBranch = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

      await useBranchesStore.getState().deleteBranch('unmerged', true);

      expect(window.electronAPI.git.deleteBranch).toHaveBeenCalledWith('unmerged', true);
    });
  });

  describe('merge', () => {
    it('should return merge result on success', async () => {
      window.electronAPI.git.merge = vi.fn().mockResolvedValue({
        success: true,
        data: { success: true, conflicts: [] },
      });

      const result = await useBranchesStore.getState().merge('feature');

      expect(result).toEqual({ success: true, conflicts: [] });
    });

    it('should return conflicts on merge failure', async () => {
      window.electronAPI.git.merge = vi.fn().mockResolvedValue({
        success: true,
        data: { success: false, conflicts: ['file.ts'] },
      });

      const result = await useBranchesStore.getState().merge('feature');

      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('file.ts');
    });
  });

  describe('stash operations', () => {
    it('should create stash and refresh', async () => {
      window.electronAPI.git.stash = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.stashList = vi.fn().mockResolvedValue({
        success: true,
        data: [{ index: 0, hash: 'abc', message: 'WIP', date: '2024-01-01' }],
      });

      await useBranchesStore.getState().stash('WIP', true);

      expect(window.electronAPI.git.stash).toHaveBeenCalledWith({
        message: 'WIP',
        includeUntracked: true,
      });
    });

    it('should apply stash', async () => {
      window.electronAPI.git.stashApply = vi.fn().mockResolvedValue({ success: true });

      await useBranchesStore.getState().stashApply(0);

      expect(window.electronAPI.git.stashApply).toHaveBeenCalledWith(0);
    });

    it('should pop stash and refresh list', async () => {
      window.electronAPI.git.stashPop = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.stashList = vi.fn().mockResolvedValue({ success: true, data: [] });

      await useBranchesStore.getState().stashPop(0);

      expect(window.electronAPI.git.stashPop).toHaveBeenCalledWith(0);
      expect(window.electronAPI.git.stashList).toHaveBeenCalled();
    });

    it('should drop stash and refresh list', async () => {
      window.electronAPI.git.stashDrop = vi.fn().mockResolvedValue({ success: true });
      window.electronAPI.git.stashList = vi.fn().mockResolvedValue({ success: true, data: [] });

      await useBranchesStore.getState().stashDrop(1);

      expect(window.electronAPI.git.stashDrop).toHaveBeenCalledWith(1);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useBranchesStore.setState({
        branches: [createMockBranch('main')],
        stashes: [{ index: 0, hash: 'abc', message: 'WIP', date: '2024-01-01' }],
        currentBranch: 'main',
        isLoading: true,
        error: 'Error',
      });

      useBranchesStore.getState().reset();

      const state = useBranchesStore.getState();
      expect(state.branches).toEqual([]);
      expect(state.stashes).toEqual([]);
      expect(state.currentBranch).toBeNull();
    });
  });
});

