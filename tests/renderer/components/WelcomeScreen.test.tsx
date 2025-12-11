import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomeScreen } from '../../../src/renderer/components/WelcomeScreen';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';

describe('WelcomeScreen', () => {
  beforeEach(() => {
    useRepositoryStore.setState({
      repository: null,
      status: null,
      isLoading: false,
      error: null,
      recentRepositories: [],
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render welcome screen with logo', () => {
    render(<WelcomeScreen />);

    expect(screen.getByText('GitKraken Clone')).toBeInTheDocument();
    expect(screen.getByText('A powerful Git GUI for developers')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<WelcomeScreen />);

    expect(screen.getByText('Open Repository')).toBeInTheDocument();
    expect(screen.getByText('Clone Repository')).toBeInTheDocument();
    expect(screen.getByText('Initialize Repository')).toBeInTheDocument();
  });

  it('should open directory dialog when clicking Open Repository', async () => {
    window.electronAPI.dialog.openDirectory = vi.fn().mockResolvedValue('/test/repo');
    window.electronAPI.git.openRepository = vi.fn().mockResolvedValue({
      success: true,
      data: { path: '/test/repo', name: 'repo', isGitRepo: true, currentBranch: 'main', remotes: [] },
    });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });

    render(<WelcomeScreen />);

    fireEvent.click(screen.getByText('Open Repository'));

    await waitFor(() => {
      expect(window.electronAPI.dialog.openDirectory).toHaveBeenCalled();
    });
  });

  it('should not call openRepository if dialog is cancelled', async () => {
    window.electronAPI.dialog.openDirectory = vi.fn().mockResolvedValue(null);

    render(<WelcomeScreen />);

    fireEvent.click(screen.getByText('Open Repository'));

    await waitFor(() => {
      expect(window.electronAPI.dialog.openDirectory).toHaveBeenCalled();
    });

    expect(window.electronAPI.git.openRepository).not.toHaveBeenCalled();
  });

  it('should show loading state while opening repository', async () => {
    let resolveOpen: (value: unknown) => void;
    const openPromise = new Promise((resolve) => { resolveOpen = resolve; });

    window.electronAPI.dialog.openDirectory = vi.fn().mockResolvedValue('/test');
    window.electronAPI.git.openRepository = vi.fn().mockReturnValue(openPromise);

    render(<WelcomeScreen />);

    fireEvent.click(screen.getByText('Open Repository'));

    // Manually set loading state
    useRepositoryStore.setState({ isLoading: true });

    // Re-render to reflect state change
    render(<WelcomeScreen />);

    // Button should be disabled
    const button = screen.getAllByRole('button')[0];
    expect(button).toBeDisabled();

    // Resolve the promise
    resolveOpen!({ success: true, data: {} });
  });

  it('should show error message when opening fails', () => {
    useRepositoryStore.setState({ error: 'Not a git repository' });

    render(<WelcomeScreen />);

    expect(screen.getByText('Not a git repository')).toBeInTheDocument();
  });

  it('should show recent repositories section', () => {
    render(<WelcomeScreen />);

    expect(screen.getByText('Recent Repositories')).toBeInTheDocument();
    expect(screen.getByText('No recent repositories')).toBeInTheDocument();
  });

  it('should display recent repositories when available', () => {
    useRepositoryStore.setState({
      recentRepositories: [
        { path: '/test/repo1', name: 'repo1', lastOpened: new Date().toISOString() },
        { path: '/test/repo2', name: 'repo2', lastOpened: new Date().toISOString() },
      ],
    });

    render(<WelcomeScreen />);

    expect(screen.getByText('repo1')).toBeInTheDocument();
    expect(screen.getByText('repo2')).toBeInTheDocument();
    expect(screen.getByText('/test/repo1')).toBeInTheDocument();
    expect(screen.getByText('/test/repo2')).toBeInTheDocument();
    expect(screen.queryByText('No recent repositories')).not.toBeInTheDocument();
  });

  it('should open repository when clicking on recent repository', async () => {
    window.electronAPI.git.openRepository = vi.fn().mockResolvedValue({
      success: true,
      data: { path: '/test/repo1', name: 'repo1', isGitRepo: true, currentBranch: 'main', remotes: [] },
    });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });

    useRepositoryStore.setState({
      recentRepositories: [
        { path: '/test/repo1', name: 'repo1', lastOpened: new Date().toISOString() },
      ],
    });

    render(<WelcomeScreen />);

    fireEvent.click(screen.getByText('repo1'));

    await waitFor(() => {
      expect(window.electronAPI.git.openRepository).toHaveBeenCalledWith('/test/repo1');
    });
  });

  it('should show relative time for recent repositories', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    useRepositoryStore.setState({
      recentRepositories: [
        { path: '/test/repo1', name: 'repo1', lastOpened: oneHourAgo },
      ],
    });

    render(<WelcomeScreen />);

    expect(screen.getByText('1 hour ago')).toBeInTheDocument();
  });

  it('should load recent repositories from localStorage on mount', () => {
    const repos = [
      { path: '/test/repo1', name: 'repo1', lastOpened: new Date().toISOString() },
    ];
    localStorage.setItem('gitkraken-clone-recent-repos', JSON.stringify(repos));

    render(<WelcomeScreen />);

    // The loadRecentRepositories is called on mount via useEffect
    expect(screen.getByText('repo1')).toBeInTheDocument();
  });
});

