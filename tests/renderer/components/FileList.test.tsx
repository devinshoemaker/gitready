import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileList } from '../../../src/renderer/components/staging/FileList';
import { useUIStore } from '../../../src/renderer/stores/ui.store';
import { useRepositoryStore } from '../../../src/renderer/stores/repository.store';
import type { GitFileStatus } from '../../../src/shared/types/git.types';

const createMockFileStatus = (path: string, index: string, workingDir: string): GitFileStatus => ({
  path,
  index: index as GitFileStatus['index'],
  workingDir: workingDir as GitFileStatus['workingDir'],
  isStaged: index !== ' ' && index !== '?',
  isConflicted: index === 'U' || workingDir === 'U',
});

describe('FileList', () => {
  beforeEach(() => {
    useUIStore.setState({
      selectedFile: null,
      currentView: 'graph',
      selectFile: vi.fn(),
      setCurrentView: vi.fn(),
    });
    useRepositoryStore.setState({
      refreshStatus: vi.fn().mockResolvedValue(undefined),
    });
    vi.clearAllMocks();
  });

  it('should display empty state for no staged changes', () => {
    render(<FileList files={[]} type="staged" />);

    expect(screen.getByText('No staged changes')).toBeInTheDocument();
  });

  it('should display empty state for no unstaged changes', () => {
    render(<FileList files={[]} type="unstaged" />);

    expect(screen.getByText('No unstaged changes')).toBeInTheDocument();
  });

  it('should display file name', () => {
    const files = [createMockFileStatus('src/components/App.tsx', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    expect(screen.getByText('App.tsx')).toBeInTheDocument();
  });

  it('should display directory path', () => {
    const files = [createMockFileStatus('src/components/App.tsx', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    expect(screen.getByText('src/components/')).toBeInTheDocument();
  });

  it('should display status badge with correct letter', () => {
    const files = [createMockFileStatus('file.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('should select file AND switch to diff view on single click', () => {
    const mockSelectFile = vi.fn();
    const mockSetCurrentView = vi.fn();
    useUIStore.setState({
      selectFile: mockSelectFile,
      setCurrentView: mockSetCurrentView,
    });

    const files = [createMockFileStatus('test.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    // Click on the file row
    fireEvent.click(screen.getByText('test.ts').closest('div[class*="cursor-pointer"]')!);

    // Should both select file AND set view to diff
    expect(mockSelectFile).toHaveBeenCalledWith('test.ts');
    expect(mockSetCurrentView).toHaveBeenCalledWith('diff');
  });

  it('should highlight selected file', () => {
    useUIStore.setState({
      selectedFile: 'selected.ts',
    });

    const files = [
      createMockFileStatus('selected.ts', 'M', ' '),
      createMockFileStatus('other.ts', 'M', ' '),
    ];

    const { container } = render(<FileList files={files} type="staged" />);

    // The selected file should have the selected styling
    const selectedRow = container.querySelector('.bg-gk-accent-cyan\\/10');
    expect(selectedRow).toBeInTheDocument();
  });

  it('should call unstage when clicking unstage button for staged file', async () => {
    const mockRefreshStatus = vi.fn().mockResolvedValue(undefined);
    useRepositoryStore.setState({ refreshStatus: mockRefreshStatus });
    window.electronAPI.git.unstage = vi.fn().mockResolvedValue({ success: true });

    const files = [createMockFileStatus('test.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    // Find the unstage button
    const unstageButton = screen.getByTitle('Unstage');
    fireEvent.click(unstageButton);

    await waitFor(() => {
      expect(window.electronAPI.git.unstage).toHaveBeenCalledWith(['test.ts']);
      expect(mockRefreshStatus).toHaveBeenCalled();
    });
  });

  it('should call stage when clicking stage button for unstaged file', async () => {
    const mockRefreshStatus = vi.fn().mockResolvedValue(undefined);
    useRepositoryStore.setState({ refreshStatus: mockRefreshStatus });
    window.electronAPI.git.stage = vi.fn().mockResolvedValue({ success: true });

    const files = [createMockFileStatus('test.ts', ' ', 'M')];

    render(<FileList files={files} type="unstaged" />);

    // Find the stage button
    const stageButton = screen.getByTitle('Stage');
    fireEvent.click(stageButton);

    await waitFor(() => {
      expect(window.electronAPI.git.stage).toHaveBeenCalledWith(['test.ts']);
      expect(mockRefreshStatus).toHaveBeenCalled();
    });
  });

  it('should show discard button for unstaged files', () => {
    const files = [createMockFileStatus('test.ts', ' ', 'M')];

    render(<FileList files={files} type="unstaged" />);

    expect(screen.getByTitle('Discard changes')).toBeInTheDocument();
  });

  it('should not show discard button for staged files', () => {
    const files = [createMockFileStatus('test.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    expect(screen.queryByTitle('Discard changes')).not.toBeInTheDocument();
  });

  it('should show view diff button', () => {
    const files = [createMockFileStatus('test.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    expect(screen.getByTitle('View diff')).toBeInTheDocument();
  });

  it('should select file and switch to diff view when clicking view diff button', () => {
    const mockSelectFile = vi.fn();
    const mockSetCurrentView = vi.fn();
    useUIStore.setState({
      selectFile: mockSelectFile,
      setCurrentView: mockSetCurrentView,
    });

    const files = [createMockFileStatus('test.ts', 'M', ' ')];

    render(<FileList files={files} type="staged" />);

    const viewDiffButton = screen.getByTitle('View diff');
    fireEvent.click(viewDiffButton);

    expect(mockSelectFile).toHaveBeenCalledWith('test.ts');
    expect(mockSetCurrentView).toHaveBeenCalledWith('diff');
  });
});
