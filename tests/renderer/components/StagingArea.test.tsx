import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StagingArea } from '../../../src/renderer/components/staging/StagingArea';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitStatus, GitFileStatus } from '../../../src/shared/types/git.types';

const createMockFileStatus = (path: string, index: string, workingDir: string): GitFileStatus => ({
  path,
  index: index as GitFileStatus['index'],
  workingDir: workingDir as GitFileStatus['workingDir'],
  isStaged: index !== ' ' && index !== '?',
  isConflicted: index === 'U' || workingDir === 'U',
});

const createMockStatus = (staged: GitFileStatus[], unstaged: GitFileStatus[]): GitStatus => ({
  current: 'main',
  tracking: 'origin/main',
  ahead: 0,
  behind: 0,
  staged,
  unstaged,
  conflicted: [],
  created: [],
  deleted: [],
  modified: [],
  renamed: [],
  isClean: staged.length === 0 && unstaged.length === 0,
});

describe('StagingArea', () => {
  beforeEach(() => {
    useRepositoryStore.setState({
      repository: null,
      status: null,
      isLoading: false,
      error: null,
    });
    useUIStore.setState({
      isCommitPanelOpen: true,
      selectedFile: null,
    });
    vi.clearAllMocks();
  });

  it('should show loading spinner when no status', () => {
    const { container } = render(<StagingArea />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should show staged and unstaged sections', () => {
    useRepositoryStore.setState({
      status: createMockStatus([], []),
    });

    render(<StagingArea />);

    expect(screen.getByText('Staged Changes')).toBeInTheDocument();
    expect(screen.getByText('Unstaged Changes')).toBeInTheDocument();
  });

  it('should display staged files', () => {
    const stagedFiles = [
      createMockFileStatus('src/index.ts', 'M', ' '),
      createMockFileStatus('src/app.ts', 'A', ' '),
    ];

    useRepositoryStore.setState({
      status: createMockStatus(stagedFiles, []),
    });

    render(<StagingArea />);

    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
  });

  it('should display unstaged files', () => {
    const unstagedFiles = [
      createMockFileStatus('src/utils.ts', ' ', 'M'),
    ];

    useRepositoryStore.setState({
      status: createMockStatus([], unstagedFiles),
    });

    render(<StagingArea />);

    expect(screen.getByText('utils.ts')).toBeInTheDocument();
  });

  it('should show file count in header', () => {
    const files = [
      createMockFileStatus('file1.ts', 'M', ' '),
      createMockFileStatus('file2.ts', ' ', 'M'),
    ];

    useRepositoryStore.setState({
      status: createMockStatus([files[0]], [files[1]]),
    });

    render(<StagingArea />);

    expect(screen.getByText('2 files')).toBeInTheDocument();
  });

  it('should show "Unstage All" button when staged files exist', () => {
    useRepositoryStore.setState({
      status: createMockStatus([createMockFileStatus('file.ts', 'M', ' ')], []),
    });

    render(<StagingArea />);

    expect(screen.getByText('Unstage All')).toBeInTheDocument();
  });

  it('should show "Stage All" button when unstaged files exist', () => {
    useRepositoryStore.setState({
      status: createMockStatus([], [createMockFileStatus('file.ts', ' ', 'M')]),
    });

    render(<StagingArea />);

    expect(screen.getByText('Stage All')).toBeInTheDocument();
  });

  it('should call unstage for all staged files', async () => {
    const stagedFiles = [createMockFileStatus('file.ts', 'M', ' ')];
    useRepositoryStore.setState({
      status: createMockStatus(stagedFiles, []),
    });

    window.electronAPI.git.unstage = vi.fn().mockResolvedValue({ success: true });

    render(<StagingArea />);

    fireEvent.click(screen.getByText('Unstage All'));

    await waitFor(() => {
      expect(window.electronAPI.git.unstage).toHaveBeenCalledWith(['file.ts']);
    });
  });

  it('should call stage for all unstaged files', async () => {
    const unstagedFiles = [createMockFileStatus('file.ts', ' ', 'M')];
    useRepositoryStore.setState({
      status: createMockStatus([], unstagedFiles),
    });

    window.electronAPI.git.stage = vi.fn().mockResolvedValue({ success: true });

    render(<StagingArea />);

    fireEvent.click(screen.getByText('Stage All'));

    await waitFor(() => {
      expect(window.electronAPI.git.stage).toHaveBeenCalledWith(['file.ts']);
    });
  });

  it('should call refreshStatus after unstaging all files', async () => {
    const mockRefreshStatus = vi.fn().mockResolvedValue(undefined);
    const stagedFiles = [createMockFileStatus('file.ts', 'M', ' ')];
    useRepositoryStore.setState({
      status: createMockStatus(stagedFiles, []),
      refreshStatus: mockRefreshStatus,
    });

    window.electronAPI.git.unstage = vi.fn().mockResolvedValue({ success: true });

    render(<StagingArea />);

    fireEvent.click(screen.getByText('Unstage All'));

    await waitFor(() => {
      expect(window.electronAPI.git.unstage).toHaveBeenCalledWith(['file.ts']);
      expect(mockRefreshStatus).toHaveBeenCalled();
    });
  });

  it('should call refreshStatus after staging all files', async () => {
    const mockRefreshStatus = vi.fn().mockResolvedValue(undefined);
    const unstagedFiles = [createMockFileStatus('file.ts', ' ', 'M')];
    useRepositoryStore.setState({
      status: createMockStatus([], unstagedFiles),
      refreshStatus: mockRefreshStatus,
    });

    window.electronAPI.git.stage = vi.fn().mockResolvedValue({ success: true });

    render(<StagingArea />);

    fireEvent.click(screen.getByText('Stage All'));

    await waitFor(() => {
      expect(window.electronAPI.git.stage).toHaveBeenCalledWith(['file.ts']);
      expect(mockRefreshStatus).toHaveBeenCalled();
    });
  });

  it('should toggle commit panel', () => {
    useRepositoryStore.setState({
      status: createMockStatus([], []),
    });

    render(<StagingArea />);

    const commitButton = screen.getByText('Commit');
    fireEvent.click(commitButton);

    expect(useUIStore.getState().isCommitPanelOpen).toBe(false);
  });

  it('should show empty state for no staged changes', () => {
    useRepositoryStore.setState({
      status: createMockStatus([], [createMockFileStatus('file.ts', ' ', 'M')]),
    });

    render(<StagingArea />);

    expect(screen.getByText('No staged changes')).toBeInTheDocument();
  });

  it('should show empty state for no unstaged changes', () => {
    useRepositoryStore.setState({
      status: createMockStatus([createMockFileStatus('file.ts', 'M', ' ')], []),
    });

    render(<StagingArea />);

    expect(screen.getByText('No unstaged changes')).toBeInTheDocument();
  });
});

