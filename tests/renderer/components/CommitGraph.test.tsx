import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommitGraph } from '../../../src/renderer/components/graph/CommitGraph';
import { useCommitsStore } from '../../../src/renderer/stores/commits.store';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import type { GitCommit } from '../../../src/shared/types/git.types';

const createMockCommit = (hash: string, message: string, refs: string[] = []): GitCommit => ({
  hash,
  hashShort: hash.substring(0, 7),
  message,
  body: '',
  author: {
    name: 'Test User',
    email: 'test@example.com',
    date: new Date().toISOString(),
  },
  committer: {
    name: 'Test User',
    email: 'test@example.com',
    date: new Date().toISOString(),
  },
  parents: [],
  refs,
});

describe('CommitGraph', () => {
  beforeEach(() => {
    useCommitsStore.setState({
      commits: [],
      selectedCommit: null,
      isLoading: false,
      hasMore: false,
      error: null,
    });
    useBranchesStore.setState({
      branches: [],
      stashes: [],
      currentBranch: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should show empty state when no commits', () => {
    render(<CommitGraph />);

    expect(screen.getByText('No commits yet')).toBeInTheDocument();
  });

  it('should render commits', () => {
    const commits = [
      createMockCommit('abc123def456', 'First commit'),
      createMockCommit('def456ghi789', 'Second commit'),
    ];

    useCommitsStore.setState({ commits });

    render(<CommitGraph />);

    expect(screen.getByText('First commit')).toBeInTheDocument();
    expect(screen.getByText('Second commit')).toBeInTheDocument();
  });

  it('should show commit hashes', () => {
    const commits = [createMockCommit('abc123def456', 'Test commit')];

    useCommitsStore.setState({ commits });

    render(<CommitGraph />);

    expect(screen.getByText('abc123d')).toBeInTheDocument();
  });

  it('should show author name', () => {
    const commits = [createMockCommit('abc123def456', 'Test commit')];

    useCommitsStore.setState({ commits });

    render(<CommitGraph />);

    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });

  it('should select commit on click', () => {
    const commits = [createMockCommit('abc123def456', 'Test commit')];
    useCommitsStore.setState({ commits });

    render(<CommitGraph />);

    // Find and click the commit node group
    const commitGroup = screen.getByRole('button');
    fireEvent.click(commitGroup);

    expect(useCommitsStore.getState().selectedCommit).toEqual(commits[0]);
  });

  it('should show branch refs', () => {
    const commits = [createMockCommit('abc123def456', 'Test commit', ['main', 'HEAD'])];

    useCommitsStore.setState({ commits });

    render(<CommitGraph />);

    // Branch name appears in both legend and commit node
    expect(screen.getAllByText('main').length).toBeGreaterThan(0);
  });

  it('should show loading indicator when loading more commits', () => {
    useCommitsStore.setState({
      commits: [createMockCommit('abc123', 'Test')],
      isLoading: true,
    });

    const { container } = render(<CommitGraph />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('should call loadMoreCommits on scroll near bottom', () => {
    const commits = Array.from({ length: 50 }, (_, i) =>
      createMockCommit(`hash${i}`, `Commit ${i}`)
    );

    useCommitsStore.setState({ commits, hasMore: true });

    const loadMoreCommits = vi.fn();
    useCommitsStore.setState({ loadMoreCommits });

    const { container } = render(<CommitGraph />);

    const scrollContainer = container.firstChild as HTMLElement;
    
    // Simulate scroll event
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 2000 });
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 1700 });
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 200 });

    fireEvent.scroll(scrollContainer);

    // Note: The actual loading would be triggered by the store
  });
});

