import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';

describe('useRepositoryStore', () => {
  beforeEach(() => {
    // Reset the store
    useRepositoryStore.setState({
      repository: null,
      status: null,
      isLoading: false,
      error: null,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useRepositoryStore.getState();

      expect(state.repository).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('openRepository', () => {
    it('should set loading state while opening', async () => {
      window.electronAPI.git.openRepository = vi.fn().mockImplementation(() => {
        // Check loading state during execution
        expect(useRepositoryStore.getState().isLoading).toBe(true);
        return Promise.resolve({ success: true, data: { path: '/test', name: 'test', isGitRepo: true, currentBranch: 'main', remotes: [] } });
      });
      window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });

      await useRepositoryStore.getState().openRepository('/test');
    });

    it('should set repository on success', async () => {
      const repoData = {
        path: '/test/repo',
        name: 'repo',
        isGitRepo: true,
        currentBranch: 'main',
        remotes: [],
      };

      window.electronAPI.git.openRepository = vi.fn().mockResolvedValue({
        success: true,
        data: repoData,
      });
      window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });

      await useRepositoryStore.getState().openRepository('/test/repo');

      const state = useRepositoryStore.getState();
      expect(state.repository).toEqual(repoData);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should set error on failure', async () => {
      window.electronAPI.git.openRepository = vi.fn().mockResolvedValue({
        success: false,
        error: 'Not a git repository',
      });

      await useRepositoryStore.getState().openRepository('/not/git');

      const state = useRepositoryStore.getState();
      expect(state.repository).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Not a git repository');
    });
  });

  describe('refreshStatus', () => {
    it('should update status on success', async () => {
      const statusData = {
        current: 'main',
        tracking: 'origin/main',
        ahead: 1,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: true,
      };

      window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({
        success: true,
        data: statusData,
      });

      await useRepositoryStore.getState().refreshStatus();

      expect(useRepositoryStore.getState().status).toEqual(statusData);
    });

    it('should set error on failure', async () => {
      window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({
        success: false,
        error: 'Git error',
      });

      await useRepositoryStore.getState().refreshStatus();

      expect(useRepositoryStore.getState().error).toBe('Git error');
    });
  });

  describe('setters', () => {
    it('should set repository', () => {
      const repo = { path: '/test', name: 'test', isGitRepo: true, currentBranch: 'main', remotes: [] };
      useRepositoryStore.getState().setRepository(repo);

      expect(useRepositoryStore.getState().repository).toEqual(repo);
    });

    it('should set status', () => {
      const status = { current: 'main', isClean: true } as any;
      useRepositoryStore.getState().setStatus(status);

      expect(useRepositoryStore.getState().status).toEqual(status);
    });

    it('should set error', () => {
      useRepositoryStore.getState().setError('Test error');

      expect(useRepositoryStore.getState().error).toBe('Test error');
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      useRepositoryStore.setState({
        repository: { path: '/test', name: 'test', isGitRepo: true, currentBranch: 'main', remotes: [] },
        status: { current: 'main', isClean: true } as any,
        isLoading: true,
        error: 'Some error',
      });

      // Reset
      useRepositoryStore.getState().reset();

      const state = useRepositoryStore.getState();
      expect(state.repository).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

