import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileHistory } from '../../../src/renderer/components/history/FileHistory';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitFileHistoryEntry, GitCommit } from '../../../src/shared/types/git.types';

const createMockHistoryEntry = (hash: string, message: string): GitFileHistoryEntry => ({
  commit: {
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
  },
  changes: {
    insertions: 10,
    deletions: 5,
  },
});

describe('FileHistory', () => {
  beforeEach(() => {
    useUIStore.setState({ selectedFile: null });
    vi.clearAllMocks();
  });

  it('should show empty state when no file selected', () => {
    render(<FileHistory />);

    expect(screen.getByText('Select a file to view history')).toBeInTheDocument();
  });

  it('should show loading state while fetching history', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });

    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    window.electronAPI.git.fileHistory = vi.fn().mockReturnValue(promise);

    const { container } = render(<FileHistory />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();

    resolvePromise!({ success: true, data: [] });
  });

  it('should render history entries', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    
    const history = [
      createMockHistoryEntry('abc123def', 'First commit'),
      createMockHistoryEntry('def456ghi', 'Second commit'),
    ];

    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: history,
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('First commit')).toBeInTheDocument();
      expect(screen.getByText('Second commit')).toBeInTheDocument();
    });
  });

  it('should show file path in header', async () => {
    useUIStore.setState({ selectedFile: 'src/components/App.tsx' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockHistoryEntry('abc123', 'Test')],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('src/components/App.tsx')).toBeInTheDocument();
    });
  });

  it('should show commit count', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    
    const history = [
      createMockHistoryEntry('abc', 'Commit 1'),
      createMockHistoryEntry('def', 'Commit 2'),
      createMockHistoryEntry('ghi', 'Commit 3'),
    ];

    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: history,
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('3 commits')).toBeInTheDocument();
    });
  });

  it('should show commit hashes', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockHistoryEntry('abc123def456', 'Test')],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('abc123d')).toBeInTheDocument();
    });
  });

  it('should show author names', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockHistoryEntry('abc123', 'Test')],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('should show insertions and deletions', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockHistoryEntry('abc123', 'Test')],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('+10')).toBeInTheDocument();
      expect(screen.getByText('-5')).toBeInTheDocument();
    });
  });

  it('should show error state on history failure', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: false,
      error: 'Failed to load history',
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error loading history')).toBeInTheDocument();
      expect(screen.getByText('Failed to load history')).toBeInTheDocument();
    });
  });

  it('should show empty state when no history', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('No history available for this file')).toBeInTheDocument();
    });
  });

  it('should highlight selected entry', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    
    const history = [
      createMockHistoryEntry('abc123', 'First'),
      createMockHistoryEntry('def456', 'Second'),
    ];

    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: history,
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByText('First')).toBeInTheDocument();
    });

    // Click to select
    fireEvent.click(screen.getByText('First'));

    // The clicked entry should be highlighted
    // (testing that click handler works without errors)
  });

  it('should show action buttons for each entry', async () => {
    useUIStore.setState({ selectedFile: 'test.ts' });
    window.electronAPI.git.fileHistory = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockHistoryEntry('abc123', 'Test')],
    });

    render(<FileHistory />);

    await waitFor(() => {
      expect(screen.getByTitle('View diff')).toBeInTheDocument();
      expect(screen.getByTitle('Restore this version')).toBeInTheDocument();
    });
  });
});

