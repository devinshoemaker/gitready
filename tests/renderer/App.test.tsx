import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import App from '../../src/renderer/App';
import { useRepositoryStore } from '../../src/renderer/stores/repository.store';
import { useCommitsStore } from '../../src/renderer/stores/commits.store';
import { useBranchesStore } from '../../src/renderer/stores/branches.store';
import { useUIStore } from '../../src/renderer/stores/ui.store';

describe('App', () => {
  const mockRefreshStatus = vi.fn();
  const mockFetchCommits = vi.fn();
  const mockFetchBranches = vi.fn();
  const mockFetchStashes = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    // Mock onRepoChange to return an unsubscribe function
    window.electronAPI.onRepoChange = vi.fn().mockReturnValue(mockUnsubscribe);

    // Reset stores
    useRepositoryStore.setState({
      repository: null,
      status: null,
      isLoading: false,
      error: null,
      refreshStatus: mockRefreshStatus,
    });
    useCommitsStore.setState({
      commits: [],
      selectedCommit: null,
      isLoading: false,
      hasMore: false,
      error: null,
      fetchCommits: mockFetchCommits,
    });
    useBranchesStore.setState({
      branches: [],
      stashes: [],
      currentBranch: null,
      isLoading: false,
      error: null,
      fetchBranches: mockFetchBranches,
      fetchStashes: mockFetchStashes,
    });
    useUIStore.setState({
      isSearchOpen: false,
      notification: null,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render WelcomeScreen when no repository is open', () => {
    const { getByText } = render(<App />);

    expect(getByText('GitKraken Clone')).toBeInTheDocument();
  });

  it('should render main app when repository is open', () => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: true,
      },
    });

    const { container } = render(<App />);

    // Should render main app structure
    expect(container.querySelector('.h-screen')).toBeInTheDocument();
  });

  it('should call refresh functions when window gains focus', async () => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: true,
      },
      refreshStatus: mockRefreshStatus,
    });

    render(<App />);

    // Clear any initial calls
    vi.clearAllMocks();

    // Simulate focus event
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    // Should call refresh functions
    expect(mockRefreshStatus).toHaveBeenCalled();
    expect(mockFetchCommits).toHaveBeenCalled();
    expect(mockFetchBranches).toHaveBeenCalled();
    expect(mockFetchStashes).toHaveBeenCalled();
  });

  it('should call refresh functions when document becomes visible', async () => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: true,
      },
      refreshStatus: mockRefreshStatus,
    });

    render(<App />);

    // Clear any initial calls
    vi.clearAllMocks();

    // Simulate visibility change to visible
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Should call refresh functions
    expect(mockRefreshStatus).toHaveBeenCalled();
    expect(mockFetchCommits).toHaveBeenCalled();
    expect(mockFetchBranches).toHaveBeenCalled();
    expect(mockFetchStashes).toHaveBeenCalled();
  });

  it('should not add focus listeners when no repository is open', async () => {
    render(<App />);

    // Clear any calls
    vi.clearAllMocks();

    // Simulate focus event
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });

    // Should NOT call refresh functions
    expect(mockRefreshStatus).not.toHaveBeenCalled();
  });

  it('should remove event listeners on unmount', async () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: true,
      },
    });

    const { unmount } = render(<App />);

    // Should have added focus listener
    expect(addEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));

    unmount();

    // Should have removed focus listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
  });
});
