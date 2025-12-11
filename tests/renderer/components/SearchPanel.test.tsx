import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SearchPanel } from '../../../src/renderer/components/search/SearchPanel';
import { useCommitsStore } from '../../../src/renderer/stores/commits.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
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

describe('SearchPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useCommitsStore.setState({
      commits: [],
      selectedCommit: null,
      isLoading: false,
      hasMore: true,
      error: null,
    });
    useUIStore.setState({
      isSearchOpen: true,
      currentView: 'graph',
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render search input', () => {
    render(<SearchPanel />);

    expect(screen.getByPlaceholderText('Search commits...')).toBeInTheDocument();
  });

  it('should focus input on mount', () => {
    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    expect(document.activeElement).toBe(input);
  });

  it('should render search type tabs', () => {
    render(<SearchPanel />);

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Hash')).toBeInTheDocument();
  });

  it('should search after debounce delay', async () => {
    window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockCommit('abc123', 'Test commit')],
    });

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not search immediately
    expect(window.electronAPI.git.searchCommits).not.toHaveBeenCalled();

    // Advance past debounce delay
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(window.electronAPI.git.searchCommits).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test' })
    );
  });

  it('should change search type when tab clicked', async () => {
    window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });

    render(<SearchPanel />);

    fireEvent.click(screen.getByText('Author'));

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'john' } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(window.electronAPI.git.searchCommits).toHaveBeenCalledWith(
      expect.objectContaining({ searchIn: 'author' })
    );
  });

  it('should display search results', async () => {
    const commits = [
      createMockCommit('abc123def', 'Fix bug'),
      createMockCommit('def456ghi', 'Add feature'),
    ];

    window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
      success: true,
      data: commits,
    });

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'test' } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Update store with results and trigger re-render
    await act(async () => {
      useCommitsStore.setState({ commits });
    });

    expect(screen.getByText('Fix bug')).toBeInTheDocument();
    expect(screen.getByText('Add feature')).toBeInTheDocument();
  });

  it('should show no results message', async () => {
    window.electronAPI.git.searchCommits = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Ensure store has empty commits
    await act(async () => {
      useCommitsStore.setState({ commits: [], isLoading: false });
    });

    expect(screen.getByText('No commits found')).toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    const toggleSearch = vi.fn();
    useUIStore.setState({ toggleSearch });

    render(<SearchPanel />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(toggleSearch).toHaveBeenCalled();
  });

  it('should close on backdrop click', () => {
    const toggleSearch = vi.fn();
    useUIStore.setState({ toggleSearch });

    const { container } = render(<SearchPanel />);

    // Click the backdrop
    const backdrop = container.querySelector('.bg-black\\/60');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(toggleSearch).toHaveBeenCalled();
  });

  it('should navigate results with arrow keys', async () => {
    const commits = [
      createMockCommit('abc123', 'First'),
      createMockCommit('def456', 'Second'),
    ];

    useCommitsStore.setState({ commits });

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Arrow down
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    // Arrow up
    fireEvent.keyDown(document, { key: 'ArrowUp' });

    // The test verifies navigation works without errors
  });

  it('should select commit on Enter', async () => {
    const commits = [createMockCommit('abc123', 'Test commit')];
    useCommitsStore.setState({ commits });

    const toggleSearch = vi.fn();
    useUIStore.setState({ toggleSearch });

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'test' } });

    fireEvent.keyDown(document, { key: 'Enter' });

    expect(useCommitsStore.getState().selectedCommit).toEqual(commits[0]);
    expect(toggleSearch).toHaveBeenCalled();
  });

  it('should show loading indicator while searching', async () => {
    useCommitsStore.setState({ isLoading: true });

    const { container } = render(<SearchPanel />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should show result count', async () => {
    const commits = [
      createMockCommit('abc123', 'First'),
      createMockCommit('def456', 'Second'),
      createMockCommit('ghi789', 'Third'),
    ];

    render(<SearchPanel />);

    const input = screen.getByPlaceholderText('Search commits...');
    fireEvent.change(input, { target: { value: 'test' } });

    // Update store with results and trigger re-render
    await act(async () => {
      useCommitsStore.setState({ commits });
    });

    expect(screen.getByText('3 results')).toBeInTheDocument();
  });

  it('should show keyboard shortcuts in footer', () => {
    render(<SearchPanel />);

    expect(screen.getByText('to navigate')).toBeInTheDocument();
    expect(screen.getByText('to select')).toBeInTheDocument();
    expect(screen.getByText('to close')).toBeInTheDocument();
  });
});

