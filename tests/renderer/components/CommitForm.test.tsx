import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { CommitForm } from '../../../src/renderer/components/staging/CommitForm';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import { useCommitsStore } from '../../../src/renderer/stores/commits.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';

const defaultStatus = {
  current: 'main',
  tracking: null,
  ahead: 0,
  behind: 0,
  staged: [{ path: 'file.ts', index: 'M', workingDir: ' ', isStaged: true, isConflicted: false }],
  unstaged: [],
  conflicted: [],
  created: [],
  deleted: [],
  modified: [],
  renamed: [],
  isClean: false,
};

describe('CommitForm', () => {
  beforeEach(() => {
    useRepositoryStore.setState({
      status: { ...defaultStatus },
      refreshStatus: vi.fn(),
    });
    useCommitsStore.setState({ 
      commits: [],
      fetchCommits: vi.fn(),
    });
    useUIStore.setState({ notification: null });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render commit message input', () => {
    render(<CommitForm />);

    expect(screen.getByPlaceholderText('Commit message...')).toBeInTheDocument();
  });

  it('should show character count', () => {
    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    expect(screen.getByText('12 characters')).toBeInTheDocument();
  });

  it('should disable commit button when no message', () => {
    render(<CommitForm />);

    const button = screen.getByRole('button', { name: /Commit/i });
    expect(button).toBeDisabled();
  });

  it('should disable commit button when no staged files', () => {
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

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const button = screen.getByRole('button', { name: /Commit/i });
    expect(button).toBeDisabled();
  });

  it('should enable commit button with message and staged files', () => {
    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test message' } });

    const button = screen.getByRole('button', { name: /Commit 1 files/i });
    expect(button).not.toBeDisabled();
  });

  it('should commit on button click', async () => {
    window.electronAPI.git.commit = vi.fn().mockResolvedValue({ success: true, data: 'abc123' });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });
    window.electronAPI.git.getLog = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test commit' } });

    const button = screen.getByRole('button', { name: /Commit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.electronAPI.git.commit).toHaveBeenCalledWith('Test commit');
    });
  });

  it('should clear message after successful commit', async () => {
    window.electronAPI.git.commit = vi.fn().mockResolvedValue({ success: true, data: 'abc123' });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });
    window.electronAPI.git.getLog = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'Test commit' } });

    const button = screen.getByRole('button', { name: /Commit/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should show notification on successful commit', async () => {
    window.electronAPI.git.commit = vi.fn().mockResolvedValue({ success: true, data: 'abc123' });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });
    window.electronAPI.git.getLog = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test commit' } });

    const button = screen.getByRole('button', { name: /Commit/i });
    fireEvent.click(button);

    await waitFor(() => {
      const notification = useUIStore.getState().notification;
      expect(notification?.type).toBe('success');
    });
  });

  it('should show error notification on failed commit', async () => {
    window.electronAPI.git.commit = vi.fn().mockResolvedValue({
      success: false,
      error: 'Commit failed',
    });

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test commit' } });

    const button = screen.getByRole('button', { name: /Commit/i });
    fireEvent.click(button);

    await waitFor(() => {
      const notification = useUIStore.getState().notification;
      expect(notification?.type).toBe('error');
      expect(notification?.message).toBe('Commit failed');
    });
  });

  it('should render conventional commit prefixes', () => {
    render(<CommitForm />);

    expect(screen.getByText('feat:')).toBeInTheDocument();
    expect(screen.getByText('fix:')).toBeInTheDocument();
    expect(screen.getByText('docs:')).toBeInTheDocument();
    expect(screen.getByText('refactor:')).toBeInTheDocument();
  });

  it('should add prefix to message when clicked', () => {
    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'add new feature' } });

    fireEvent.click(screen.getByText('feat:'));

    expect(input.value).toBe('feat: add new feature');
  });

  it('should replace existing prefix when clicking different one', () => {
    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...') as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'feat: something' } });

    fireEvent.click(screen.getByText('fix:'));

    expect(input.value).toBe('fix: something');
  });

  it('should commit on Cmd+Enter', async () => {
    window.electronAPI.git.commit = vi.fn().mockResolvedValue({ success: true, data: 'abc123' });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({ success: true, data: {} });
    window.electronAPI.git.getLog = vi.fn().mockResolvedValue({ success: true, data: [] });

    render(<CommitForm />);

    const input = screen.getByPlaceholderText('Commit message...');
    fireEvent.change(input, { target: { value: 'Test commit' } });

    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });

    await waitFor(() => {
      expect(window.electronAPI.git.commit).toHaveBeenCalled();
    });
  });
});

