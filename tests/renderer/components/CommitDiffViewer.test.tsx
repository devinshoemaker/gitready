import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommitDiffViewer } from '../../../src/renderer/components/commits/CommitDiffViewer';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitDiff } from '../../../src/shared/types/git.types';

const createMockDiff = (overrides: Partial<GitDiff> = {}): GitDiff => ({
  file: 'src/test.ts',
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
  ...overrides,
});

describe('CommitDiffViewer', () => {
  const defaultProps = {
    commitHash: 'abc123def456',
    filePath: 'src/test.ts',
    onClose: vi.fn(),
  };

  beforeEach(() => {
    useUIStore.setState({
      diffViewMode: 'unified',
    });
    vi.clearAllMocks();
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff(),
    });
  });

  it('should show loading state while fetching diff', async () => {
    let resolvePromise: (value: { success: true; data: GitDiff }) => void;
    const promise = new Promise<{ success: true; data: GitDiff }>((resolve) => {
      resolvePromise = resolve;
    });
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockReturnValue(promise);

    const { container } = render(<CommitDiffViewer {...defaultProps} />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();

    resolvePromise!({ success: true, data: createMockDiff() });
  });

  it('should render diff content', async () => {
    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('new line')).toBeInTheDocument();
      expect(screen.getByText('old line')).toBeInTheDocument();
    });
  });

  it('should call onClose when back button is clicked', async () => {
    const onClose = vi.fn();
    render(<CommitDiffViewer {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByTitle('Back to graph')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTitle('Back to graph'));

    expect(onClose).toHaveBeenCalled();
  });

  it('should show New badge for new files', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff({ isNew: true }),
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  it('should show Deleted badge for deleted files', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff({ isDeleted: true }),
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Deleted')).toBeInTheDocument();
    });
  });

  it('should show Renamed badge for renamed files', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff({ isRenamed: true }),
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Renamed')).toBeInTheDocument();
    });
  });

  it('should show Binary badge for binary files', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff({ isBinary: true, hunks: [] }),
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Binary')).toBeInTheDocument();
      expect(screen.getByText('Binary file not shown')).toBeInTheDocument();
    });
  });

  it('should toggle diff view mode', async () => {
    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Unified')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Split'));

    expect(useUIStore.getState().diffViewMode).toBe('split');
  });

  it('should show error state on diff failure', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to load diff',
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Error loading diff')).toBeInTheDocument();
      expect(screen.getByText('Failed to load diff')).toBeInTheDocument();
    });
  });

  it('should show no changes message for empty diff', async () => {
    window.electronAPI.git.getCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff({ hunks: [] }),
    });

    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No changes in this file')).toBeInTheDocument();
    });
  });

  it('should show hunk headers', async () => {
    render(<CommitDiffViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('@@ -1,3 +1,4 @@')).toBeInTheDocument();
    });
  });

  it('should call getCommitFileDiff with correct params', async () => {
    const mockGetCommitFileDiff = vi.fn().mockResolvedValue({
      success: true,
      data: createMockDiff(),
    });
    window.electronAPI.git.getCommitFileDiff = mockGetCommitFileDiff;

    render(
      <CommitDiffViewer
        commitHash="def789xyz"
        filePath="src/component.tsx"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(mockGetCommitFileDiff).toHaveBeenCalledWith('def789xyz', 'src/component.tsx');
    });
  });
});
