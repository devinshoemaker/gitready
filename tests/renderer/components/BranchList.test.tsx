import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BranchList } from '../../../src/renderer/components/branches/BranchList';
import { BranchItem } from '../../../src/renderer/components/branches/BranchItem';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import type { GitBranch } from '../../../src/shared/types/git.types';

const createMockBranch = (
  name: string,
  current = false,
  isRemote = false,
  ahead = 0,
  behind = 0
): GitBranch => ({
  name,
  current,
  commit: 'abc123',
  isRemote,
  ahead,
  behind,
});

describe('BranchList', () => {
  beforeEach(() => {
    useBranchesStore.setState({
      branches: [],
      stashes: [],
      currentBranch: null,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should show empty state when no branches', () => {
    render(<BranchList branches={[]} />);

    expect(screen.getByText('No branches')).toBeInTheDocument();
  });

  it('should render all branches', () => {
    const branches = [
      createMockBranch('main', true),
      createMockBranch('develop'),
      createMockBranch('feature/new'),
    ];

    render(<BranchList branches={branches} />);

    expect(screen.getByText('main')).toBeInTheDocument();
    expect(screen.getByText('develop')).toBeInTheDocument();
    expect(screen.getByText('feature/new')).toBeInTheDocument();
  });
});

describe('BranchItem', () => {
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

  it('should highlight current branch', () => {
    const branch = createMockBranch('main', true);

    const { container } = render(<BranchItem branch={branch} />);

    // Current branch should have cyan accent
    expect(container.querySelector('.text-gk-accent-cyan')).toBeInTheDocument();
  });

  it('should show ahead/behind indicators', () => {
    const branch = createMockBranch('feature', false, false, 2, 1);

    render(<BranchItem branch={branch} />);

    expect(screen.getByText('↑2')).toBeInTheDocument();
    expect(screen.getByText('↓1')).toBeInTheDocument();
  });

  it('should checkout branch on double click', async () => {
    window.electronAPI.git.checkout = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

    const branch = createMockBranch('develop');

    render(<BranchItem branch={branch} />);

    fireEvent.doubleClick(screen.getByText('develop'));

    await waitFor(() => {
      expect(window.electronAPI.git.checkout).toHaveBeenCalledWith('develop');
    });
  });

  it('should not checkout current branch on double click', async () => {
    const branch = createMockBranch('main', true);

    render(<BranchItem branch={branch} />);

    fireEvent.doubleClick(screen.getByText('main'));

    expect(window.electronAPI.git.checkout).not.toHaveBeenCalled();
  });

  it('should not checkout remote branch on double click', async () => {
    const branch = createMockBranch('origin/main', false, true);

    render(<BranchItem branch={branch} />);

    fireEvent.doubleClick(screen.getByText('main'));

    expect(window.electronAPI.git.checkout).not.toHaveBeenCalled();
  });

  it('should show context menu on right click', () => {
    const branch = createMockBranch('develop');

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('develop'));

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByText('Merge into current')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should not show checkout option for current branch', () => {
    const branch = createMockBranch('main', true);

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('main'));

    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
  });

  it('should checkout from context menu', async () => {
    window.electronAPI.git.checkout = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

    const branch = createMockBranch('develop');

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('develop'));
    fireEvent.click(screen.getByText('Checkout'));

    await waitFor(() => {
      expect(window.electronAPI.git.checkout).toHaveBeenCalledWith('develop');
    });
  });

  it('should merge from context menu', async () => {
    window.electronAPI.git.merge = vi.fn().mockResolvedValue({
      success: true,
      data: { success: true, conflicts: [] },
    });

    const branch = createMockBranch('feature');

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('feature'));
    fireEvent.click(screen.getByText('Merge into current'));

    await waitFor(() => {
      expect(window.electronAPI.git.merge).toHaveBeenCalledWith('feature');
    });
  });

  it('should delete from context menu with confirmation', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    window.electronAPI.git.deleteBranch = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getBranches = vi.fn().mockResolvedValue({ success: true, data: [] });

    const branch = createMockBranch('old-feature');

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('old-feature'));
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(window.electronAPI.git.deleteBranch).toHaveBeenCalledWith('old-feature', undefined);
    });
  });

  it('should not delete if confirmation cancelled', async () => {
    window.confirm = vi.fn().mockReturnValue(false);

    const branch = createMockBranch('old-feature');

    render(<BranchItem branch={branch} />);

    fireEvent.contextMenu(screen.getByText('old-feature'));
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });

    expect(window.electronAPI.git.deleteBranch).not.toHaveBeenCalled();
  });

  it('should strip origin/ prefix from remote branch names', () => {
    const branch = createMockBranch('origin/main', false, true);

    render(<BranchItem branch={branch} />);

    // Should show 'main' not 'origin/main'
    expect(screen.getByText('main')).toBeInTheDocument();
  });
});

