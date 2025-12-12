import type {
  GitCommit,
  GitBranch,
  GitStatus,
  GitDiff,
  GitStash,
  GitBlame,
  GitFileHistoryEntry,
  GitMergeResult,
  GitRebaseResult,
  GitCommitFile,
  RepositoryInfo,
} from './git.types';

// IPC Channel names
export const IPC_CHANNELS = {
  // Git operations
  GIT_OPEN_REPO: 'git:open-repo',
  GIT_CLOSE_REPO: 'git:close-repo',
  GIT_GET_STATUS: 'git:get-status',
  GIT_GET_LOG: 'git:get-log',
  GIT_GET_BRANCHES: 'git:get-branches',
  GIT_STAGE: 'git:stage',
  GIT_UNSTAGE: 'git:unstage',
  GIT_COMMIT: 'git:commit',
  GIT_CHECKOUT: 'git:checkout',
  GIT_CREATE_BRANCH: 'git:create-branch',
  GIT_DELETE_BRANCH: 'git:delete-branch',
  GIT_RENAME_BRANCH: 'git:rename-branch',
  GIT_MERGE: 'git:merge',
  GIT_REBASE: 'git:rebase',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  GIT_FETCH: 'git:fetch',
  GIT_STASH: 'git:stash',
  GIT_STASH_LIST: 'git:stash-list',
  GIT_STASH_APPLY: 'git:stash-apply',
  GIT_STASH_POP: 'git:stash-pop',
  GIT_STASH_DROP: 'git:stash-drop',
  GIT_DIFF: 'git:diff',
  GIT_DIFF_STAGED: 'git:diff-staged',
  GIT_BLAME: 'git:blame',
  GIT_FILE_HISTORY: 'git:file-history',
  GIT_SEARCH_COMMITS: 'git:search-commits',
  GIT_DISCARD_CHANGES: 'git:discard-changes',
  GIT_RESOLVE_CONFLICT: 'git:resolve-conflict',
  GIT_COMMIT_FILES: 'git:commit-files',
  GIT_COMMIT_FILE_DIFF: 'git:commit-file-diff',
  
  // Dialog operations
  DIALOG_OPEN_DIRECTORY: 'dialog:open-directory',
  
  // File operations
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  
  // Events
  REPO_CHANGED: 'repo:changed',
} as const;

// Request/Response types for IPC
export interface GitLogOptions {
  maxCount?: number;
  skip?: number;
  from?: string;
  to?: string;
  file?: string;
}

export interface GitSearchOptions {
  query: string;
  searchIn: 'message' | 'author' | 'hash' | 'all';
  maxCount?: number;
}

export interface GitPushOptions {
  remote?: string;
  branch?: string;
  setUpstream?: boolean;
  force?: boolean;
}

export interface GitPullOptions {
  remote?: string;
  branch?: string;
  rebase?: boolean;
}

export interface GitStashOptions {
  message?: string;
  includeUntracked?: boolean;
}

// Response types
export type IPCResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export interface RepoChangedEvent {
  type: 'status' | 'branch' | 'commit' | 'stash' | 'remote';
  path: string;
}

// Electron API exposed to renderer
export interface ElectronAPI {
  git: {
    openRepository: (path: string) => Promise<IPCResponse<RepositoryInfo>>;
    closeRepository: () => Promise<IPCResponse<void>>;
    getStatus: () => Promise<IPCResponse<GitStatus>>;
    getLog: (options?: GitLogOptions) => Promise<IPCResponse<GitCommit[]>>;
    getBranches: () => Promise<IPCResponse<GitBranch[]>>;
    stage: (files: string[]) => Promise<IPCResponse<void>>;
    unstage: (files: string[]) => Promise<IPCResponse<void>>;
    commit: (message: string) => Promise<IPCResponse<string>>;
    checkout: (branch: string) => Promise<IPCResponse<void>>;
    createBranch: (name: string, startPoint?: string) => Promise<IPCResponse<void>>;
    deleteBranch: (name: string, force?: boolean) => Promise<IPCResponse<void>>;
    renameBranch: (oldName: string, newName: string) => Promise<IPCResponse<void>>;
    merge: (branch: string) => Promise<IPCResponse<GitMergeResult>>;
    rebase: (branch: string) => Promise<IPCResponse<GitRebaseResult>>;
    push: (options?: GitPushOptions) => Promise<IPCResponse<void>>;
    pull: (options?: GitPullOptions) => Promise<IPCResponse<void>>;
    fetch: (remote?: string) => Promise<IPCResponse<void>>;
    stash: (options?: GitStashOptions) => Promise<IPCResponse<void>>;
    stashList: () => Promise<IPCResponse<GitStash[]>>;
    stashApply: (index: number) => Promise<IPCResponse<void>>;
    stashPop: (index: number) => Promise<IPCResponse<void>>;
    stashDrop: (index: number) => Promise<IPCResponse<void>>;
    diff: (file: string, staged?: boolean) => Promise<IPCResponse<GitDiff>>;
    blame: (file: string) => Promise<IPCResponse<GitBlame>>;
    fileHistory: (file: string) => Promise<IPCResponse<GitFileHistoryEntry[]>>;
    searchCommits: (options: GitSearchOptions) => Promise<IPCResponse<GitCommit[]>>;
    discardChanges: (files: string[]) => Promise<IPCResponse<void>>;
    resolveConflict: (file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) => Promise<IPCResponse<void>>;
    getCommitFiles: (hash: string) => Promise<IPCResponse<GitCommitFile[]>>;
    getCommitFileDiff: (hash: string, file: string) => Promise<IPCResponse<GitDiff>>;
  };
  dialog: {
    openDirectory: () => Promise<string | null>;
  };
  file: {
    readFile: (path: string) => Promise<IPCResponse<string>>;
    writeFile: (path: string, content: string) => Promise<IPCResponse<void>>;
  };
  onRepoChange: (callback: (event: RepoChangedEvent) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

