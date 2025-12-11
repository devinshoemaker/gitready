import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ConflictResolver } from '../../../src/renderer/components/conflicts/ConflictResolver';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import { useUIStore } from '../../../src/renderer/stores/ui.store';

const defaultStatus = {
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
};

describe('ConflictResolver', () => {
  beforeEach(() => {
    useRepositoryStore.setState({
      status: { ...defaultStatus },
      refreshStatus: vi.fn(),
    });
    useUIStore.setState({ 
      selectedFile: null, 
      notification: null,
      selectFile: vi.fn((file) => useUIStore.setState({ selectedFile: file })),
      showNotification: vi.fn((type, message) => useUIStore.setState({ notification: { type, message } })),
    });
    // Default mock for file read
    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({ success: true, data: 'content' });
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should show no conflicts state when no conflicts', () => {
    render(<ConflictResolver />);

    expect(screen.getByText('No Conflicts')).toBeInTheDocument();
    expect(screen.getByText('All merge conflicts have been resolved')).toBeInTheDocument();
  });

  it('should show conflicted files list', () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'file1.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
          { path: 'file2.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    render(<ConflictResolver />);

    // Files appear in both sidebar and header, so use getAllByText
    expect(screen.getAllByText('file1.ts').length).toBeGreaterThan(0);
    expect(screen.getByText('file2.ts')).toBeInTheDocument();
  });

  it('should show conflict count', () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'file1.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
          { path: 'file2.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    render(<ConflictResolver />);

    expect(screen.getByText('2 files with conflicts')).toBeInTheDocument();
  });

  it('should load file content when conflict is selected', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'conflict.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({
      success: true,
      data: `<<<<<<< HEAD
our changes
=======
their changes
>>>>>>> feature`,
    });

    render(<ConflictResolver />);

    await waitFor(() => {
      expect(window.electronAPI.file.readFile).toHaveBeenCalled();
    });
  });

  it('should show resolution buttons', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'conflict.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({
      success: true,
      data: 'content',
    });

    render(<ConflictResolver />);

    await waitFor(() => {
      expect(screen.getByText('Accept Ours')).toBeInTheDocument();
      expect(screen.getByText('Accept Theirs')).toBeInTheDocument();
      expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
    });
  });

  it('should resolve with "ours"', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'conflict.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({ success: true, data: 'content' });
    window.electronAPI.git.resolveConflict = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({
      success: true,
      data: { ...useRepositoryStore.getState().status, conflicted: [] },
    });

    render(<ConflictResolver />);

    await waitFor(() => {
      expect(screen.getByText('Accept Ours')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Ours'));

    await waitFor(() => {
      expect(window.electronAPI.git.resolveConflict).toHaveBeenCalledWith('conflict.ts', 'ours', undefined);
    });
  });

  it('should resolve with "theirs"', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'conflict.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({ success: true, data: 'content' });
    window.electronAPI.git.resolveConflict = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({
      success: true,
      data: { ...useRepositoryStore.getState().status, conflicted: [] },
    });

    render(<ConflictResolver />);

    await waitFor(() => {
      expect(screen.getByText('Accept Theirs')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Theirs'));

    await waitFor(() => {
      expect(window.electronAPI.git.resolveConflict).toHaveBeenCalledWith('conflict.ts', 'theirs', undefined);
    });
  });

  it('should select different conflict file when clicked', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'file1.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
          { path: 'file2.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({ success: true, data: 'content' });

    render(<ConflictResolver />);

    fireEvent.click(screen.getByText('file2.ts'));

    expect(useUIStore.getState().selectedFile).toBe('file2.ts');
  });

  it('should show notification on successful resolution', async () => {
    useRepositoryStore.setState({
      status: {
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        staged: [],
        unstaged: [],
        conflicted: [
          { path: 'conflict.ts', index: 'U', workingDir: 'U', isStaged: false, isConflicted: true },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: false,
      },
    });

    window.electronAPI.file.readFile = vi.fn().mockResolvedValue({ success: true, data: 'content' });
    window.electronAPI.git.resolveConflict = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI.git.getStatus = vi.fn().mockResolvedValue({
      success: true,
      data: { ...useRepositoryStore.getState().status, conflicted: [] },
    });

    render(<ConflictResolver />);

    await waitFor(() => {
      expect(screen.getByText('Accept Ours')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept Ours'));

    await waitFor(() => {
      const notification = useUIStore.getState().notification;
      expect(notification?.type).toBe('success');
      expect(notification?.message).toContain('Resolved');
    });
  });
});

