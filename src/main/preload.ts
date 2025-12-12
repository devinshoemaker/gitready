import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/types/ipc.types';
import type {
  ElectronAPI,
  GitLogOptions,
  GitSearchOptions,
  GitPushOptions,
  GitPullOptions,
  GitStashOptions,
  RepoChangedEvent,
} from '../shared/types/ipc.types';

const electronAPI: ElectronAPI = {
  git: {
    openRepository: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_OPEN_REPO, path),
    closeRepository: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_CLOSE_REPO),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_STATUS),
    getLog: (options?: GitLogOptions) => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_LOG, options),
    getBranches: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_GET_BRANCHES),
    stage: (files: string[]) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STAGE, files),
    unstage: (files: string[]) => ipcRenderer.invoke(IPC_CHANNELS.GIT_UNSTAGE, files),
    commit: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT, message),
    checkout: (branch: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_CHECKOUT, branch),
    createBranch: (name: string, startPoint?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_CREATE_BRANCH, name, startPoint),
    deleteBranch: (name: string, force?: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_DELETE_BRANCH, name, force),
    renameBranch: (oldName: string, newName: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_RENAME_BRANCH, oldName, newName),
    merge: (branch: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_MERGE, branch),
    rebase: (branch: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_REBASE, branch),
    push: (options?: GitPushOptions) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PUSH, options),
    pull: (options?: GitPullOptions) => ipcRenderer.invoke(IPC_CHANNELS.GIT_PULL, options),
    fetch: (remote?: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_FETCH, remote),
    stash: (options?: GitStashOptions) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH, options),
    stashList: () => ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_LIST),
    stashApply: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_APPLY, index),
    stashPop: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_POP, index),
    stashDrop: (index: number) => ipcRenderer.invoke(IPC_CHANNELS.GIT_STASH_DROP, index),
    diff: (file: string, staged?: boolean) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_DIFF, file, staged),
    blame: (file: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_BLAME, file),
    fileHistory: (file: string) => ipcRenderer.invoke(IPC_CHANNELS.GIT_FILE_HISTORY, file),
    searchCommits: (options: GitSearchOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_SEARCH_COMMITS, options),
    discardChanges: (files: string[]) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_DISCARD_CHANGES, files),
    resolveConflict: (file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_RESOLVE_CONFLICT, file, resolution, content),
    getCommitFiles: (hash: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT_FILES, hash),
    getCommitFileDiff: (hash: string, file: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.GIT_COMMIT_FILE_DIFF, hash, file),
  },
  dialog: {
    openDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY),
  },
  file: {
    readFile: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.FILE_READ, path),
    writeFile: (path: string, content: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.FILE_WRITE, path, content),
  },
  onRepoChange: (callback: (event: RepoChangedEvent) => void) => {
    const handler = (_: Electron.IpcRendererEvent, event: RepoChangedEvent) => callback(event);
    ipcRenderer.on(IPC_CHANNELS.REPO_CHANGED, handler);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.REPO_CHANGED, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

