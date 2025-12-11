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
      recentRepositories: [],
    });

    // Clear localStorage
    localStorage.clear();

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

  describe('closeRepository', () => {
    it('should call electronAPI.git.closeRepository and reset state', async () => {
      // Set some state to simulate an open repository
      useRepositoryStore.setState({
        repository: { path: '/test', name: 'test', isGitRepo: true, currentBranch: 'main', remotes: [] },
        status: { current: 'main', isClean: true } as any,
        isLoading: false,
        error: null,
      });

      window.electronAPI.git.closeRepository = vi.fn().mockResolvedValue({ success: true, data: undefined });

      await useRepositoryStore.getState().closeRepository();

      expect(window.electronAPI.git.closeRepository).toHaveBeenCalled();
      const state = useRepositoryStore.getState();
      expect(state.repository).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should reset state even if closeRepository IPC fails', async () => {
      useRepositoryStore.setState({
        repository: { path: '/test', name: 'test', isGitRepo: true, currentBranch: 'main', remotes: [] },
        status: { current: 'main', isClean: true } as any,
        isLoading: false,
        error: null,
      });

      window.electronAPI.git.closeRepository = vi.fn().mockRejectedValue(new Error('Failed to close'));

      await useRepositoryStore.getState().closeRepository();

      expect(window.electronAPI.git.closeRepository).toHaveBeenCalled();
      // State should still be reset even if IPC fails
      const state = useRepositoryStore.getState();
      expect(state.repository).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('recentRepositories', () => {
    it('should have empty recentRepositories initially', () => {
      const state = useRepositoryStore.getState();
      expect(state.recentRepositories).toEqual([]);
    });

    it('should load recent repositories from localStorage', () => {
      const repos = [
        { path: '/test/repo1', name: 'repo1', lastOpened: '2024-01-01T00:00:00.000Z' },
        { path: '/test/repo2', name: 'repo2', lastOpened: '2024-01-02T00:00:00.000Z' },
      ];
      localStorage.setItem('gitkraken-clone-recent-repos', JSON.stringify(repos));

      useRepositoryStore.getState().loadRecentRepositories();

      expect(useRepositoryStore.getState().recentRepositories).toEqual(repos);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorage.setItem('gitkraken-clone-recent-repos', 'invalid json');

      useRepositoryStore.getState().loadRecentRepositories();

      expect(useRepositoryStore.getState().recentRepositories).toEqual([]);
    });

    it('should add repository to recent list', () => {
      const repo = { path: '/test/repo', name: 'repo', lastOpened: '2024-01-01T00:00:00.000Z' };

      useRepositoryStore.getState().addToRecentRepositories(repo);

      expect(useRepositoryStore.getState().recentRepositories).toEqual([repo]);
      expect(localStorage.getItem('gitkraken-clone-recent-repos')).toBe(JSON.stringify([repo]));
    });

    it('should move existing repository to top of list', () => {
      const repo1 = { path: '/test/repo1', name: 'repo1', lastOpened: '2024-01-01T00:00:00.000Z' };
      const repo2 = { path: '/test/repo2', name: 'repo2', lastOpened: '2024-01-02T00:00:00.000Z' };
      useRepositoryStore.setState({ recentRepositories: [repo1, repo2] });

      const updatedRepo2 = { path: '/test/repo2', name: 'repo2', lastOpened: '2024-01-03T00:00:00.000Z' };
      useRepositoryStore.getState().addToRecentRepositories(updatedRepo2);

      const state = useRepositoryStore.getState();
      expect(state.recentRepositories).toHaveLength(2);
      expect(state.recentRepositories[0]).toEqual(updatedRepo2);
      expect(state.recentRepositories[1]).toEqual(repo1);
    });

    it('should limit recent repositories to 10', () => {
      const repos = Array.from({ length: 10 }, (_, i) => ({
        path: `/test/repo${i}`,
        name: `repo${i}`,
        lastOpened: new Date(2024, 0, i + 1).toISOString(),
      }));
      useRepositoryStore.setState({ recentRepositories: repos });

      const newRepo = { path: '/test/newrepo', name: 'newrepo', lastOpened: new Date(2024, 0, 15).toISOString() };
      useRepositoryStore.getState().addToRecentRepositories(newRepo);

      const state = useRepositoryStore.getState();
      expect(state.recentRepositories).toHaveLength(10);
      expect(state.recentRepositories[0]).toEqual(newRepo);
      expect(state.recentRepositories[9].path).toBe('/test/repo8');
    });

    it('should remove repository from recent list', () => {
      const repo1 = { path: '/test/repo1', name: 'repo1', lastOpened: '2024-01-01T00:00:00.000Z' };
      const repo2 = { path: '/test/repo2', name: 'repo2', lastOpened: '2024-01-02T00:00:00.000Z' };
      useRepositoryStore.setState({ recentRepositories: [repo1, repo2] });

      useRepositoryStore.getState().removeFromRecentRepositories('/test/repo1');

      expect(useRepositoryStore.getState().recentRepositories).toEqual([repo2]);
      expect(localStorage.getItem('gitkraken-clone-recent-repos')).toBe(JSON.stringify([repo2]));
    });

    it('should add to recent repositories when opening a repository', async () => {
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
      expect(state.recentRepositories).toHaveLength(1);
      expect(state.recentRepositories[0].path).toBe('/test/repo');
      expect(state.recentRepositories[0].name).toBe('repo');
    });
  });
});

