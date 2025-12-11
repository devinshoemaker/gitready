import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toolbar } from '../../../src/renderer/components/layout/Toolbar';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';

describe('Toolbar', () => {
  beforeEach(() => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: 'origin/main',
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
    useBranchesStore.setState({
      currentBranch: 'main',
      branches: [],
      stashes: [],
      isLoading: false,
      error: null,
    });
    useUIStore.setState({
      isSearchOpen: false,
      notification: null,
    });

    vi.clearAllMocks();
  });

  it('should render with pl-20 class for proper logo positioning', () => {
    const { container } = render(<Toolbar />);

    // The toolbar should have pl-20 class to account for macOS window controls
    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toHaveClass('pl-20');
  });

  it('should render repository name', () => {
    render(<Toolbar />);

    expect(screen.getByText('test-repo')).toBeInTheDocument();
  });

  it('should render current branch', () => {
    render(<Toolbar />);

    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should show "No branch" when no branch is selected', () => {
    useBranchesStore.setState({ currentBranch: null });

    render(<Toolbar />);

    expect(screen.getByText('No branch')).toBeInTheDocument();
  });

  it('should render Pull, Push, and Fetch buttons', () => {
    render(<Toolbar />);

    expect(screen.getByText('Pull')).toBeInTheDocument();
    expect(screen.getByText('Push')).toBeInTheDocument();
    expect(screen.getByText('Fetch')).toBeInTheDocument();
  });

  it('should show behind count when there are commits to pull', () => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: 'origin/main',
        ahead: 0,
        behind: 3,
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

    render(<Toolbar />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show ahead count when there are commits to push', () => {
    useRepositoryStore.setState({
      repository: { path: '/test/repo', name: 'test-repo' },
      status: {
        current: 'main',
        tracking: 'origin/main',
        ahead: 5,
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

    render(<Toolbar />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should call toggleSearch when search button is clicked', () => {
    const mockToggleSearch = vi.fn();
    useUIStore.setState({ toggleSearch: mockToggleSearch });

    render(<Toolbar />);

    const searchButton = screen.getByTitle('Search (Cmd+K)');
    fireEvent.click(searchButton);

    expect(mockToggleSearch).toHaveBeenCalled();
  });

  it('should call git.pull when Pull button is clicked', async () => {
    const mockShowNotification = vi.fn();
    useUIStore.setState({ showNotification: mockShowNotification });
    window.electronAPI.git.pull = vi.fn().mockResolvedValue({ success: true });

    render(<Toolbar />);

    const pullButton = screen.getByTitle('Pull');
    fireEvent.click(pullButton);

    await waitFor(() => {
      expect(window.electronAPI.git.pull).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('success', 'Pull completed successfully');
    });
  });

  it('should call git.push when Push button is clicked', async () => {
    const mockShowNotification = vi.fn();
    useUIStore.setState({ showNotification: mockShowNotification });
    window.electronAPI.git.push = vi.fn().mockResolvedValue({ success: true });

    render(<Toolbar />);

    const pushButton = screen.getByTitle('Push');
    fireEvent.click(pushButton);

    await waitFor(() => {
      expect(window.electronAPI.git.push).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('success', 'Push completed successfully');
    });
  });

  it('should call git.fetch when Fetch button is clicked', async () => {
    const mockShowNotification = vi.fn();
    useUIStore.setState({ showNotification: mockShowNotification });
    window.electronAPI.git.fetch = vi.fn().mockResolvedValue({ success: true });

    render(<Toolbar />);

    const fetchButton = screen.getByTitle('Fetch');
    fireEvent.click(fetchButton);

    await waitFor(() => {
      expect(window.electronAPI.git.fetch).toHaveBeenCalled();
      expect(mockShowNotification).toHaveBeenCalledWith('success', 'Fetch completed successfully');
    });
  });

  it('should have pr-4 class for right padding', () => {
    const { container } = render(<Toolbar />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toHaveClass('pr-4');
  });
});
