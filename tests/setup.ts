import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock electron
vi.mock('electron', () => ({
  ipcRenderer: {
    invoke: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  contextBridge: {
    exposeInMainWorld: vi.fn(),
  },
}));

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    git: {
      openRepository: vi.fn(),
      closeRepository: vi.fn(),
      getStatus: vi.fn(),
      getLog: vi.fn(),
      getBranches: vi.fn(),
      stage: vi.fn(),
      unstage: vi.fn(),
      commit: vi.fn(),
      checkout: vi.fn(),
      createBranch: vi.fn(),
      deleteBranch: vi.fn(),
      merge: vi.fn(),
      push: vi.fn(),
      pull: vi.fn(),
      fetch: vi.fn(),
      stash: vi.fn(),
      stashList: vi.fn(),
      stashApply: vi.fn(),
      stashDrop: vi.fn(),
      diff: vi.fn(),
      blame: vi.fn(),
      fileHistory: vi.fn(),
      searchCommits: vi.fn(),
      discardChanges: vi.fn(),
      resolveConflict: vi.fn(),
      getCommitFiles: vi.fn(),
      getCommitFileDiff: vi.fn(),
    },
    dialog: {
      openDirectory: vi.fn(),
    },
    file: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
    },
    onRepoChange: vi.fn(),
  },
  writable: true,
});

