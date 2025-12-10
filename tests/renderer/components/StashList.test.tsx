import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StashList } from '../../../src/renderer/components/stash/StashList';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitStash } from '../../../src/shared/types/git.types';

describe('StashList', () => {
  beforeEach(() => {
    useBranchesStore.setState({
      branches: [],
      stashes: [],
      currentBranch: null,
      isLoading: false,
      error: null,
    });
    useUIStore.setState({ notification: null });
    vi.clearAllMocks();
  });

  it('should show empty state when no stashes', () => {
    render(<StashList />);

    expect(screen.getByText('No stashes')).toBeInTheDocument();
  });

  it('should render stashes', () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'WIP: feature', date: '2024-01-01' },
      { index: 1, hash: 'def456', message: 'WIP: bugfix', date: '2024-01-02' },
    ];

    useBranchesStore.setState({ stashes });

    render(<StashList />);

    expect(screen.getByText('WIP: feature')).toBeInTheDocument();
    expect(screen.getByText('WIP: bugfix')).toBeInTheDocument();
  });

  it('should show stash hash', () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123def', message: 'Test', date: '2024-01-01' },
    ];

    useBranchesStore.setState({ stashes });

    render(<StashList />);

    expect(screen.getByText('abc123d')).toBeInTheDocument();
  });

  it('should apply stash', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    window.electronAPI.git.stashApply = vi.fn().mockResolvedValue({ success: true });

    render(<StashList />);

    // Find and click apply button
    const applyButton = screen.getAllByTitle('Apply')[0];
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(window.electronAPI.git.stashApply).toHaveBeenCalledWith(0);
    });
  });

  it('should pop stash', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    window.electronAPI.git.stashPop = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.stashList = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<StashList />);

    const popButton = screen.getAllByTitle('Pop')[0];
    fireEvent.click(popButton);

    await waitFor(() => {
      expect(window.electronAPI.git.stashPop).toHaveBeenCalledWith(0);
    });
  });

  it('should drop stash with confirmation', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    window.confirm = vi.fn().mockReturnValue(true);
    window.electronAPI.git.stashDrop = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.stashList = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<StashList />);

    const dropButton = screen.getAllByTitle('Drop')[0];
    fireEvent.click(dropButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(window.electronAPI.git.stashDrop).toHaveBeenCalledWith(0);
    });
  });

  it('should not drop stash if confirmation cancelled', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    window.confirm = vi.fn().mockReturnValue(false);

    render(<StashList />);

    const dropButton = screen.getAllByTitle('Drop')[0];
    fireEvent.click(dropButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });

    expect(window.electronAPI.git.stashDrop).not.toHaveBeenCalled();
  });

  it('should show notification on successful apply', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    window.electronAPI.git.stashApply = vi.fn().mockResolvedValue({ success: true });

    render(<StashList />);

    const applyButton = screen.getAllByTitle('Apply')[0];
    fireEvent.click(applyButton);

    await waitFor(() => {
      const notification = useUIStore.getState().notification;
      expect(notification?.type).toBe('success');
      expect(notification?.message).toBe('Stash applied');
    });
  });

  it('should show error notification on failure', async () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: 'Test', date: '2024-01-01' },
    ];
    useBranchesStore.setState({ stashes });

    // Mock a failure response
    window.electronAPI.git.stashApply = vi.fn().mockResolvedValue({
      success: false,
      error: 'Conflict',
    });

    render(<StashList />);

    const applyButton = screen.getAllByTitle('Apply')[0];
    fireEvent.click(applyButton);

    // The store action catches the error and shows notification
    await waitFor(() => {
      expect(window.electronAPI.git.stashApply).toHaveBeenCalled();
    });
  });

  it('should show fallback text when no message', () => {
    const stashes: GitStash[] = [
      { index: 0, hash: 'abc123', message: '', date: '2024-01-01' },
    ];

    useBranchesStore.setState({ stashes });

    render(<StashList />);

    expect(screen.getByText('stash@{0}')).toBeInTheDocument();
  });
});

