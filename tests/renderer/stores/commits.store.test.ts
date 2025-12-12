import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommitsStore } from '../../../src/renderer/stores/commits.store';
import type { GitCommit } from '../../../src/shared/types/git.types';

const createMockCommit = (hash: string, message: string): GitCommit => ({
  hash,
  hashShort: hash.substring(0, 7),
  message,
  body: '',
  author: {
    name: 'Test User',
    email: 'test@example.com',
    date: '2024-01-01T12:00:00Z',
  },
  committer: {
    name: 'Test User',
    email: 'test@example.com',
    date: '2024-01-01T12:00:00Z',
  },
  parents: [],
  refs: [],
});

describe('useCommitsStore', () => {
  beforeEach(() => {
    useCommitsStore.setState({
      commits: [],
      selectedCommit: null,
      selectedCommitFile: null,
      isLoading: false,
      hasMore: true,
      error: null,
    });

    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useCommitsStore.getState();

      expect(state.commits).toEqual([]);
      expect(state.selectedCommit).toBeNull();
      expect(state.selectedCommitFile).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchCommits', () => {
    it('should fetch and set commits', async () => {
      const mockCommits = [
        createMockCommit('abc123def', 'First commit'),
        createMockCommit('def456ghi', 'Second commit'),
      ];

      window.electronAPI.git.getLog = vi.fn().mockResolvedValue({
        success: true,
        data: mockCommits,
      });

      await useCommitsStore.getState().fetchCommits();

      const state = useCommitsStore.getState();
      expect(state.commits).toHaveLength(2);
      expect(state.commits[0].message).toBe('First commit');
      expect(state.isLoading).toBe(false);
    });

    it('should set hasMore to false when fewer than max commits', async () => {
      window.electronAPI.git.getLog = vi.fn().mockResolvedValue({
        success: true,
        data: [createMockCommit('abc123', 'Commit')],
      });

      await useCommitsStore.getState().fetchCommits();

      expect(useCommitsStore.getState().hasMore).toBe(false);
    });

    it('should set error on failure', async () => {
      window.electronAPI.git.getLog = vi.fn().mockResolvedValue({
        success: false,
        error: 'Log error',
      });

      await useCommitsStore.getState().fetchCommits();

      const state = useCommitsStore.getState();
      expect(state.error).toBe('Log error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('loadMoreCommits', () => {
    it('should append commits to existing list', async () => {
      const existingCommits = [createMockCommit('abc123', 'First')];
      const newCommits = [createMockCommit('def456', 'Second')];

      useCommitsStore.setState({ commits: existingCommits, hasMore: true });

      window.electronAPI.git.getLog = vi.fn().mockResolvedValue({
        success: true,
        data: newCommits,
      });

      await useCommitsStore.getState().loadMoreCommits();

      expect(useCommitsStore.getState().commits).toHaveLength(2);
    });

    it('should not load if hasMore is false', async () => {
      useCommitsStore.setState({ hasMore: false });

      window.electronAPI.git.getLog = vi.fn();

      await useCommitsStore.getState().loadMoreCommits();

      expect(window.electronAPI.git.getLog).not.toHaveBeenCalled();
    });

    it('should not load if already loading', async () => {
      useCommitsStore.setState({ isLoading: true });

      window.electronAPI.git.getLog = vi.fn();

      await useCommitsStore.getState().loadMoreCommits();

      expect(window.electronAPI.git.getLog).not.toHaveBeenCalled();
    });

    it('should pass skip option based on existing commits', async () => {
      const commits = [
        createMockCommit('a', '1'),
        createMockCommit('b', '2'),
      ];
      useCommitsStore.setState({ commits, hasMore: true });

      window.electronAPI.git.getLog = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });

      await useCommitsStore.getState().loadMoreCommits();

      expect(window.electronAPI.git.getLog).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 2 })
      );
    });
  });

  describe('selectCommit', () => {
    it('should set selected commit', () => {
      const commit = createMockCommit('abc123', 'Test');

      useCommitsStore.getState().selectCommit(commit);

      expect(useCommitsStore.getState().selectedCommit).toEqual(commit);
    });

    it('should clear selected commit when null', () => {
      useCommitsStore.setState({ selectedCommit: createMockCommit('abc', 'Test') });

      useCommitsStore.getState().selectCommit(null);

      expect(useCommitsStore.getState().selectedCommit).toBeNull();
    });

    it('should clear selected commit file when selecting a commit', () => {
      useCommitsStore.setState({ selectedCommitFile: 'src/file.ts' });
      const commit = createMockCommit('abc123', 'Test');

      useCommitsStore.getState().selectCommit(commit);

      expect(useCommitsStore.getState().selectedCommitFile).toBeNull();
    });
  });

  describe('selectCommitFile', () => {
    it('should set selected commit file', () => {
      useCommitsStore.getState().selectCommitFile('src/app.ts');

      expect(useCommitsStore.getState().selectedCommitFile).toBe('src/app.ts');
    });

    it('should clear selected commit file when null', () => {
      useCommitsStore.setState({ selectedCommitFile: 'src/app.ts' });

      useCommitsStore.getState().selectCommitFile(null);

      expect(useCommitsStore.getState().selectedCommitFile).toBeNull();
    });
  });

  describe('searchCommits', () => {
    it('should search and update commits', async () => {
      const searchResults = [createMockCommit('abc123', 'Fix bug')];

      window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
        success: true,
        data: searchResults,
      });

      await useCommitsStore.getState().searchCommits('bug', 'message');

      const state = useCommitsStore.getState();
      expect(state.commits).toEqual(searchResults);
      expect(state.hasMore).toBe(false); // Search doesn't have pagination
    });

    it('should pass correct search options', async () => {
      window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
        success: true,
        data: [],
      });

      await useCommitsStore.getState().searchCommits('john', 'author');

      expect(window.electronAPI.git.searchCommits).toHaveBeenCalledWith({
        query: 'john',
        searchIn: 'author',
        maxCount: expect.any(Number),
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      useCommitsStore.setState({
        commits: [createMockCommit('abc', 'Test')],
        selectedCommit: createMockCommit('abc', 'Test'),
        selectedCommitFile: 'src/file.ts',
        isLoading: true,
        hasMore: false,
        error: 'Error',
      });

      useCommitsStore.getState().reset();

      const state = useCommitsStore.getState();
      expect(state.commits).toEqual([]);
      expect(state.selectedCommit).toBeNull();
      expect(state.selectedCommitFile).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.hasMore).toBe(true);
      expect(state.error).toBeNull();
    });
  });
});

