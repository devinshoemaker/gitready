import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DiffViewer } from '../../../src/renderer/components/diff/DiffViewer';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import type { GitDiff } from '../../../src/shared/types/git.types';

const createMockDiff = (file: string): GitDiff => ({
  file,
  isNew: false,
  isDeleted: false,
  isRenamed: false,
  isBinary: false,
  hunks: [
    {
      oldStart: 1,
      oldLines: 3,
      newStart: 1,
      newLines: 4,
      lines: [
        { type: 'context', content: 'line 1', oldLineNumber: 1, newLineNumber: 1 },
        { type: 'delete', content: 'old line', oldLineNumber: 2 },
        { type: 'add', content: 'new line', newLineNumber: 2 },
        { type: 'add', content: 'another new line', newLineNumber: 3 },
        { type: 'context', content: 'line 3', oldLineNumber: 3, newLineNumber: 4 },
      ],
    },
  ],
});

describe('DiffViewer', () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedFile: null,
      diffViewMode: 'unified',
    });
    useRepositoryStore.setState({
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
    vi.clearAllMocks();
  });

  it('should show empty state when no file selected', () => {
    render(<DiffViewer />);

    expect(screen.getByText('Select a file to view diff')).toBeInTheDocument();
  });

  it('should show loading state while fetching diff', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });

    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    window.electronAPI.git.diff = vi.fn().mockReturnValue(promise);

    const { container } = render(<DiffViewer />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();

    resolvePromise!({ success: true, data: createMockDiff('test.ts') });
  });

  it('should render diff content', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff('test.ts'),
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('line 1')).toBeInTheDocument();
      expect(screen.getByText('old line')).toBeInTheDocument();
      expect(screen.getByText('new line')).toBeInTheDocument();
    });
  });

  it('should show file path in header', async () => {
    useUIStore.setState({ selectedFile: 'src/components/App.tsx' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff('src/components/App.tsx'),
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('src/components/App.tsx')).toBeInTheDocument();
    });
  });

  it('should show New badge for new files', async () => {
    useUIStore.setState({ selectedFile: 'new-file.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: { ...createMockDiff('new-file.ts'), isNew: true },
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  it('should show Deleted badge for deleted files', async () => {
    useUIStore.setState({ selectedFile: 'old-file.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: { ...createMockDiff('old-file.ts'), isDeleted: true },
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });
  });

  it('should show Renamed badge for renamed files', async () => {
    useUIStore.setState({ selectedFile: 'renamed.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: { ...createMockDiff('renamed.ts'), isRenamed: true, oldFile: 'old-name.ts' },
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('Renamed')).toBeInTheDocument();
    });
  });

  it('should show Binary badge for binary files', async () => {
    useUIStore.setState({ selectedFile: 'image.png' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: { ...createMockDiff('image.png'), isBinary: true, hunks: [] },
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('Binary')).toBeInTheDocument();
      expect(screen.getByText('Binary file not shown')).toBeInTheDocument();
    });
  });

  it('should toggle between unified and split view', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff('test.ts'),
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('Unified')).toBeInTheDocument();
      expect(screen.getByText('Split')).toBeInTheDocument();
    });

    // Click split view
    fireEvent.click(screen.getByText('Split'));

    expect(useUIStore.getState().diffViewMode).toBe('split');
  });

  it('should show error state on diff failure', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to load diff',
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('Error loading diff')).toBeInTheDocument();
      expect(screen.getByText('Failed to load diff')).toBeInTheDocument();
    });
  });

  it('should show no changes message for empty diff', async () => {
    useUIStore.setState({ selectedFile: 'unchanged.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: { ...createMockDiff('unchanged.ts'), hunks: [] },
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('No changes in this file')).toBeInTheDocument();
    });
  });

  it('should show hunk headers', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.diff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff('test.ts'),
    });

    render(<DiffViewer />);

    await waitFor(() => {
      expect(screen.getByText('@@ -1,3 +1,4 @@')).toBeInTheDocument();
    });
  });
});

