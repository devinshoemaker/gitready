import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateBranchModal } from '../../../src/renderer/components/branches/CreateBranchModal';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import { useBranchesStore } from '../../../src/renderer/stores/branches.store';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';

describe('CreateBranchModal', () => {
  const mockToggleCreateBranch = vi.fn();
  const mockShowNotification = vi.fn();
  const mockCreateBranch = vi.fn();
  const mockFetchBranches = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useUIStore.setState({
      isCreateBranchOpen: true,
      toggleCreateBranch: mockToggleCreateBranch,
      showNotification: mockShowNotification,
    });

    useBranchesStore.setState({
      branches: [],
      createBranch: mockCreateBranch,
      fetchBranches: mockFetchBranches,
    });

    useRepositoryStore.setState({
      repository: {
        path: '/test/repo',
        name: 'test-repo',
        isGitRepo: true,
        currentBranch: 'main',
        remotes: [],
      },
    });

    mockCreateBranch.mockResolvedValue(undefined);
    mockFetchBranches.mockResolvedValue(undefined);
  });

  it('should render modal with title', () => {
    render(<CreateBranchModal />);

    expect(screen.getByText('Create New Branch')).toBeInTheDocument();
  });

  it('should render branch name input', () => {
    render(<CreateBranchModal />);

    expect(screen.getByLabelText('Branch Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('feature/my-new-feature')).toBeInTheDocument();
  });

  it('should show current branch as starting point', () => {
    render(<CreateBranchModal />);

    expect(screen.getByText('Starting from:')).toBeInTheDocument();
    expect(screen.getByText('main')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<CreateBranchModal />);

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);

    expect(mockToggleCreateBranch).toHaveBeenCalled();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<CreateBranchModal />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockToggleCreateBranch).toHaveBeenCalled();
  });

  it('should close modal when clicking backdrop', () => {
    const { container } = render(<CreateBranchModal />);

    const backdrop = container.querySelector('.fixed.inset-0');
    fireEvent.click(backdrop!);

    expect(mockToggleCreateBranch).toHaveBeenCalled();
  });

  it('should close modal on escape key', () => {
    render(<CreateBranchModal />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockToggleCreateBranch).toHaveBeenCalled();
  });

  it('should update input value when typing', () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'my-feature' } });

    expect(input).toHaveValue('my-feature');
  });

  it('should show error for empty branch name on submit', async () => {
    render(<CreateBranchModal />);

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Branch name is required')).toBeInTheDocument();
    });

    expect(mockCreateBranch).not.toHaveBeenCalled();
  });

  it('should show error for branch name with spaces', async () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'my feature' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Branch name cannot contain spaces')).toBeInTheDocument();
    });

    expect(mockCreateBranch).not.toHaveBeenCalled();
  });

  it('should show error for branch name starting with dash', async () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: '-my-feature' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(screen.getByText('Branch name cannot start with - or .')).toBeInTheDocument();
    });

    expect(mockCreateBranch).not.toHaveBeenCalled();
  });

  it('should call createBranch with valid branch name', async () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'feature/new-feature' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockCreateBranch).toHaveBeenCalledWith('feature/new-feature');
    });
  });

  it('should show success notification and close modal on success', async () => {
    mockCreateBranch.mockResolvedValue(undefined);

    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'my-branch' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith(
        'success',
        'Created and switched to branch "my-branch"'
      );
    });

    expect(mockToggleCreateBranch).toHaveBeenCalled();
  });

  it('should refresh branches after creating', async () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'new-branch' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockFetchBranches).toHaveBeenCalled();
    });
  });

  it('should show error notification on failure', async () => {
    mockCreateBranch.mockRejectedValue(new Error('Branch already exists'));

    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'existing-branch' } });

    const form = screen.getByRole('button', { name: /create branch/i }).closest('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockShowNotification).toHaveBeenCalledWith('error', 'Branch already exists');
    });
  });

  it('should disable form while creating', async () => {
    let resolveCreate: () => void;
    mockCreateBranch.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveCreate = resolve;
      })
    );

    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    fireEvent.change(input, { target: { value: 'new-branch' } });

    const submitButton = screen.getByRole('button', { name: /create branch/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    expect(input).toBeDisabled();

    resolveCreate!();
  });

  it('should auto-focus input on mount', () => {
    render(<CreateBranchModal />);

    const input = screen.getByLabelText('Branch Name');
    expect(document.activeElement).toBe(input);
  });
});
