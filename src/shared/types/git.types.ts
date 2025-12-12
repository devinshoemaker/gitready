export interface GitCommit {
  hash: string;
  hashShort: string;
  message: string;
  body: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  parents: string[];
  refs: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
  tracking?: string;
  ahead?: number;
  behind?: number;
  isRemote: boolean;
}

export interface GitRemote {
  name: string;
  fetchUrl: string;
  pushUrl: string;
}

export interface GitStash {
  index: number;
  hash: string;
  message: string;
  date: string;
}

export interface GitFileStatus {
  path: string;
  index: FileStatusCode;
  workingDir: FileStatusCode;
  isStaged: boolean;
  isConflicted: boolean;
}

export type FileStatusCode = 
  | ' '  // Unmodified
  | 'M'  // Modified
  | 'A'  // Added
  | 'D'  // Deleted
  | 'R'  // Renamed
  | 'C'  // Copied
  | 'U'  // Unmerged
  | '?'  // Untracked
  | '!'; // Ignored

export interface GitStatus {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  conflicted: GitFileStatus[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: { from: string; to: string }[];
  isClean: boolean;
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'add' | 'delete' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitDiff {
  file: string;
  oldFile?: string;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
  isBinary: boolean;
  hunks: GitDiffHunk[];
}

export interface GitCommitFile {
  path: string;
  status: 'A' | 'M' | 'D' | 'R' | 'C';  // Added, Modified, Deleted, Renamed, Copied
  oldPath?: string;  // For renames
}

export interface GitBlame {
  lines: GitBlameLine[];
}

export interface GitBlameLine {
  lineNumber: number;
  content: string;
  commit: {
    hash: string;
    hashShort: string;
    author: string;
    date: string;
    message: string;
  };
}

export interface GitFileHistoryEntry {
  commit: GitCommit;
  changes: {
    insertions: number;
    deletions: number;
  };
}

export interface GitMergeResult {
  success: boolean;
  conflicts: string[];
  message?: string;
}

export interface GitConflict {
  file: string;
  ourContent: string;
  theirContent: string;
  baseContent: string;
}

export interface RepositoryInfo {
  path: string;
  name: string;
  isGitRepo: boolean;
  currentBranch: string | null;
  remotes: GitRemote[];
}

export interface RecentRepository {
  path: string;
  name: string;
  lastOpened: string; // ISO date string
}

