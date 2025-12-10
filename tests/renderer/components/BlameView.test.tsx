import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BlameView } from '../../../src/renderer/components/blame/BlameView';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitBlame } from '../../../src/shared/types/git.types';

const createMockBlame = (): GitBlame => ({
  lines: [
    {
      lineNumber: 1,
      content: 'const x = 1;',
      commit: {
        hash: 'abc123def456',
        hashShort: 'abc123d',
        author: 'Test User',
        date: '2024-01-01T12:00:00Z',
        message: 'Initial commit',
      },
    },
    {
      lineNumber: 2,
      content: 'const y = 2;',
      commit: {
        hash: 'abc123def456',
        hashShort: 'abc123d',
        author: 'Test User',
        date: '2024-01-01T12:00:00Z',
        message: 'Initial commit',
      },
    },
    {
      lineNumber: 3,
      content: 'const z = x + y;',
      commit: {
        hash: 'def456ghi789',
        hashShort: 'def456g',
        author: 'Another User',
        date: '2024-01-02T12:00:00Z',
        message: 'Add z variable',
      },
    },
  ],
});

describe('BlameView', () => {
  beforeEach(() => {
    useUIStore.setState({ selectedFile: null });
    vi.clearAllMocks();
  });

  it('should show empty state when no file selected', () => {
    render(<BlameView />);

    expect(screen.getByText('Select a file to view blame')).toBeInTheDocument();
  });

  it('should show loading state while fetching blame', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });

    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    window.electronAPI.git.blame = vi.fn().mockReturnValue(promise);

    const { container } = render(<BlameView />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();

    resolvePromise!({ success: true, data: createMockBlame() });
  });

  it('should render blame content', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('const x = 1;')).toBeInTheDocument();
      expect(screen.getByText('const y = 2;')).toBeInTheDocument();
      expect(screen.getByText('const z = x + y;')).toBeInTheDocument();
    });
  });

  it('should show file path in header', async () => {
    useUIStore.setState({ selectedFile: 'src/utils/helper.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('src/utils/helper.ts')).toBeInTheDocument();
    });
  });

  it('should show line count', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('3 lines')).toBeInTheDocument();
    });
  });

  it('should show commit hashes', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('abc123d')).toBeInTheDocument();
      expect(screen.getByText('def456g')).toBeInTheDocument();
    });
  });

  it('should show author names', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Another User')).toBeInTheDocument();
    });
  });

  it('should show error state on blame failure', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to load blame',
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('Error loading blame')).toBeInTheDocument();
      expect(screen.getByText('Failed to load blame')).toBeInTheDocument();
    });
  });

  it('should show empty state when no blame data', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: { lines: [] },
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('No blame information available')).toBeInTheDocument();
    });
  });

  it('should only show commit info for first line of same commit', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      // First two lines are same commit - should only show info once
      const testUserElements = screen.getAllByText('Test User');
      expect(testUserElements).toHaveLength(1);
    });
  });

  it('should show line numbers', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.blame = vi.fn().mockResolvedValue({
      success: true,
      data: createMockBlame(),
    });

    render(<BlameView />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});

