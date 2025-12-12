import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommitDetails } from '../../../src/renderer/components/commits/CommitDetails';
import { useCommitsStore } from '../../../src/renderer/stores/commits.store';
import type { GitCommit, GitCommitFile } from '../../../src/shared/types/git.types';

const createMockCommit = (overrides: Partial<GitCommit> = {}): GitCommit => ({
  hash: 'abc123def456789012345678901234567890abcd',
  hashShort: 'abc123d',
  message: 'Test commit message',
  body: '',
  author: {
    name: 'Test Author',
    email: 'author@example.com',
    date: '2024-01-15T10:30:00Z',
  },
  committer: {
    name: 'Test Author',
    email: 'author@example.com',
    date: '2024-01-15T10:30:00Z',
  },
  parents: [],
  refs: [],
  ...overrides,
});

const createMockFiles = (): GitCommitFile[] => [
  { path: 'src/app.ts', status: 'M' },
  { path: 'src/new-file.ts', status: 'A' },
  { path: 'src/deleted.ts', status: 'D' },
];

describe('CommitDetails', () => {
  beforeEach(() => {
    useCommitsStore.setState({
      commits: [],
      selectedCommit: null,
      selectedCommitFile: null,
      isLoading: false,
      hasMore: false,
      error: null,
    });
    vi.clearAllMocks();
    // Mock getCommitFiles to return empty by default
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it('should render nothing when no commit is selected', () => {
    const { container } = render(<CommitDetails />);

    expect(container.firstChild).toBeNull();
  });

  it('should render commit details header', () => {
    useCommitsStore.setState({ selectedCommit: createMockCommit() });

    render(<CommitDetails />);

    expect(screen.getByText('Commit Details')).toBeInTheDocument();
  });

  it('should display commit message', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({ message: 'Fix critical bug' }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('Fix critical bug')).toBeInTheDocument();
  });

  it('should display commit body when present', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        message: 'Update feature',
        body: 'This is a detailed description of the changes.',
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('This is a detailed description of the changes.')).toBeInTheDocument();
  });

  it('should display author name and email', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        author: {
          name: 'John Doe',
          email: 'john@example.com',
          date: '2024-01-15T10:30:00Z',
        },
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display commit hash', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        hash: 'abc123def456789012345678901234567890abcd',
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('abc123def456789012345678901234567890abcd')).toBeInTheDocument();
  });

  it('should close panel when close button is clicked', () => {
    const mockSelectCommit = vi.fn();
    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
      selectCommit: mockSelectCommit,
    });

    render(<CommitDetails />);

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);

    expect(mockSelectCommit).toHaveBeenCalledWith(null);
  });

  it('should copy hash when copy button is clicked', async () => {
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        hash: 'abc123def456789012345678901234567890abcd',
      }),
    });

    render(<CommitDetails />);

    const copyButton = screen.getByTitle('Copy hash');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith('abc123def456789012345678901234567890abcd');
  });

  it('should display branch refs', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        refs: ['main', 'HEAD -> main'],
      }),
    });

    render(<CommitDetails />);

    // Both refs parse to "main" so we expect multiple elements
    expect(screen.getAllByText('main').length).toBeGreaterThan(0);
  });

  it('should display tag refs with emoji', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        refs: ['tag: v1.0.0'],
      }),
    });

    render(<CommitDetails />);

    // Tag should be displayed
    expect(screen.getByText(/v1.0.0/)).toBeInTheDocument();
  });

  it('should display parent commits', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        parents: ['parent123456789'],
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('Parent')).toBeInTheDocument();
    expect(screen.getByText('parent1')).toBeInTheDocument();
  });

  it('should show "Parents" label for multiple parents', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        parents: ['parent1abcdef123', 'parent2abcdef456'],
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('Parents')).toBeInTheDocument();
  });

  it('should show merge commit indicator for commits with multiple parents', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        message: 'Merge branch feature',
        parents: ['parent1abc', 'parent2def'],
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('This is a merge commit')).toBeInTheDocument();
  });

  it('should not show merge indicator for single-parent commits', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        parents: ['singleParent'],
      }),
    });

    render(<CommitDetails />);

    expect(screen.queryByText('This is a merge commit')).not.toBeInTheDocument();
  });

  it('should display committer when different from author', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        author: {
          name: 'Original Author',
          email: 'author@example.com',
          date: '2024-01-15T10:30:00Z',
        },
        committer: {
          name: 'Different Committer',
          email: 'committer@example.com',
          date: '2024-01-15T11:00:00Z',
        },
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('Original Author')).toBeInTheDocument();
    expect(screen.getByText('Different Committer')).toBeInTheDocument();
  });

  it('should display author initial in avatar', () => {
    useCommitsStore.setState({
      selectedCommit: createMockCommit({
        author: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          date: '2024-01-15T10:30:00Z',
        },
      }),
    });

    render(<CommitDetails />);

    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('should display changed files section', async () => {
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: createMockFiles(),
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(screen.getByText('Changed Files (3)')).toBeInTheDocument();
    });
  });

  it('should show file status badges', async () => {
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: createMockFiles(),
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(screen.getByText('src/app.ts')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument(); // Added
      expect(screen.getByText('M')).toBeInTheDocument(); // Modified
      expect(screen.getByText('D')).toBeInTheDocument(); // Deleted
    });
  });

  it('should show no files message when no files changed', async () => {
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(screen.getByText('No files changed')).toBeInTheDocument();
    });
  });

  it('should call selectCommitFile when file is clicked', async () => {
    const mockSelectCommitFile = vi.fn();
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: createMockFiles(),
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
      selectCommitFile: mockSelectCommitFile,
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(screen.getByText('src/app.ts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('src/app.ts'));

    expect(mockSelectCommitFile).toHaveBeenCalledWith('src/app.ts');
  });

  it('should fetch commit files when commit is selected', async () => {
    const mockGetCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: createMockFiles(),
    });
    window.electronAPI.git.getCommitFiles = mockGetCommitFiles;

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(mockGetCommitFiles).toHaveBeenCalledWith('abc123def456789012345678901234567890abcd');
    });
  });

  it('should show renamed file with old path', async () => {
    window.electronAPI.git.getCommitFiles = vi.fn().mockResolvedValue({
      success: true,
      data: [{ path: 'src/new-name.ts', status: 'R', oldPath: 'src/old-name.ts' }],
    });

    useCommitsStore.setState({
      selectedCommit: createMockCommit(),
    });

    render(<CommitDetails />);

    await waitFor(() => {
      expect(screen.getByText('src/new-name.ts')).toBeInTheDocument();
      expect(screen.getByText('← src/old-name.ts')).toBeInTheDocument();
    });
  });
});
