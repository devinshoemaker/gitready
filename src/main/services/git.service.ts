import simpleGit, { SimpleGit, StatusResult, LogResult, BranchSummary } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import type {
  GitCommit,
  GitBranch,
  GitStatus,
  GitFileStatus,
  GitDiff,
  GitDiffHunk,
  GitDiffLine,
  GitStash,
  GitBlame,
  GitBlameLine,
  GitFileHistoryEntry,
  GitMergeResult,
  GitRebaseResult,
  GitCommitFile,
  RepositoryInfo,
} from '../../shared/types/git.types';
import type {
  GitLogOptions,
  GitSearchOptions,
  GitPushOptions,
  GitPullOptions,
  GitStashOptions,
} from '../../shared/types/ipc.types';

export class GitService {
  private git: SimpleGit;
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
  }

  async getRepositoryInfo(): Promise<RepositoryInfo> {
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }

    const branch = await this.git.branchLocal();
    const remotes = await this.git.getRemotes(true);

    return {
      path: this.repoPath,
      name: path.basename(this.repoPath),
      isGitRepo: true,
      currentBranch: branch.current || null,
      remotes: remotes.map((r) => ({
        name: r.name,
        fetchUrl: r.refs.fetch || '',
        pushUrl: r.refs.push || '',
      })),
    };
  }

  async getStatus(): Promise<GitStatus> {
    const status: StatusResult = await this.git.status();

    const mapFileStatus = (file: { path: string; index: string; working_dir: string }): GitFileStatus => ({
      path: file.path,
      index: file.index as GitFileStatus['index'],
      workingDir: file.working_dir as GitFileStatus['workingDir'],
      isStaged: file.index !== ' ' && file.index !== '?',
      isConflicted: file.index === 'U' || file.working_dir === 'U',
    });

    const staged = status.files
      .filter((f) => f.index !== ' ' && f.index !== '?')
      .map(mapFileStatus);

    const unstaged = status.files
      .filter((f) => f.working_dir !== ' ' || f.index === '?')
      .map(mapFileStatus);

    const conflicted = status.files
      .filter((f) => f.index === 'U' || f.working_dir === 'U')
      .map(mapFileStatus);

    return {
      current: status.current,
      tracking: status.tracking,
      ahead: status.ahead,
      behind: status.behind,
      staged,
      unstaged,
      conflicted,
      created: status.created,
      deleted: status.deleted,
      modified: status.modified,
      renamed: status.renamed.map((r) => ({ from: r.from, to: r.to })),
      isClean: status.isClean(),
    };
  }

  async getLog(options?: GitLogOptions): Promise<GitCommit[]> {
    const maxCount = options?.maxCount || 100;
    const skip = options?.skip || 0;
    const filePath = options?.file;

    // Use raw git command to get all branches with proper formatting
    const args = [
      'log',
      '--all',  // Include all branches (local and remote)
      '--topo-order', // Topological order for proper branch visualization
      `--max-count=${maxCount}`,
      '--format=%H|%h|%s|%an|%ae|%ad|%P|%D',
      '--date=iso',
    ];

    if (skip > 0) {
      args.push(`--skip=${skip}`);
    }

    if (filePath) {
      args.push('--', filePath);
    }

    try {
      const result = await this.git.raw(args);
      const lines = result.trim().split('\n').filter(Boolean);

      return lines.map((line) => {
        const parts = line.split('|');
        const hash = parts[0];
        const hashShort = parts[1];
        const message = parts[2];
        const authorName = parts[3];
        const authorEmail = parts[4];
        const date = parts[5];
        const parents = parts[6] ? parts[6].split(' ').filter(Boolean) : [];
        const refs = parts[7] ? parts[7].split(', ').filter(Boolean) : [];

        return {
          hash,
          hashShort,
          message,
          body: '',
          author: {
            name: authorName,
            email: authorEmail,
            date,
          },
          committer: {
            name: authorName,
            email: authorEmail,
            date,
          },
          parents,
          refs,
        };
      });
    } catch (error) {
      console.error('Error fetching log:', error);
      return [];
    }
  }


  private parseCommit(commit: LogResult['all'][0]): GitCommit {
    const refs = commit.refs ? commit.refs.split(', ').filter(Boolean) : [];
    
    return {
      hash: commit.hash,
      hashShort: commit.hash.substring(0, 7),
      message: commit.message,
      body: commit.body || '',
      author: {
        name: commit.author_name,
        email: commit.author_email,
        date: commit.date,
      },
      committer: {
        name: commit.author_name,
        email: commit.author_email,
        date: commit.date,
      },
      parents: commit.refs ? [] : [], // Will be parsed from raw output
      refs,
    };
  }

  async getBranches(): Promise<GitBranch[]> {
    const [local, remote]: [BranchSummary, BranchSummary] = await Promise.all([
      this.git.branchLocal(),
      this.git.branch(['-r']),
    ]);

    const localBranches: GitBranch[] = Object.entries(local.branches).map(([name, data]) => ({
      name,
      current: data.current,
      commit: data.commit,
      tracking: (data as { label?: string }).label || undefined,
      isRemote: false,
    }));

    const remoteBranches: GitBranch[] = Object.entries(remote.branches).map(([name, data]) => ({
      name,
      current: false,
      commit: data.commit,
      isRemote: true,
    }));

    return [...localBranches, ...remoteBranches];
  }

  async stage(files: string[]): Promise<void> {
    await this.git.add(files);
  }

  async unstage(files: string[]): Promise<void> {
    await this.git.reset(['HEAD', '--', ...files]);
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return result.commit;
  }

  async checkout(branch: string): Promise<void> {
    await this.git.checkout(branch);
  }

  async createBranch(name: string, startPoint?: string): Promise<void> {
    if (startPoint) {
      await this.git.checkoutBranch(name, startPoint);
    } else {
      await this.git.checkoutLocalBranch(name);
    }
  }

  async deleteBranch(name: string, force?: boolean): Promise<void> {
    if (force) {
      await this.git.branch(['-D', name]);
    } else {
      await this.git.branch(['-d', name]);
    }
  }

  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.git.branch(['-m', oldName, newName]);
  }

  async merge(branch: string): Promise<GitMergeResult> {
    try {
      await this.git.merge([branch]);
      return { success: true, conflicts: [] };
    } catch (error) {
      const status = await this.getStatus();
      return {
        success: false,
        conflicts: status.conflicted.map((f) => f.path),
        message: (error as Error).message,
      };
    }
  }

  async rebase(branch: string): Promise<GitRebaseResult> {
    try {
      await this.git.rebase([branch]);
      return { success: true, conflicts: [] };
    } catch (error) {
      const status = await this.getStatus();
      return {
        success: false,
        conflicts: status.conflicted.map((f) => f.path),
        message: (error as Error).message,
      };
    }
  }

  async push(options?: GitPushOptions): Promise<void> {
    const args: string[] = [];
    
    if (options?.setUpstream) {
      args.push('-u');
    }
    if (options?.force) {
      args.push('--force');
    }
    if (options?.remote) {
      args.push(options.remote);
    }
    if (options?.branch) {
      args.push(options.branch);
    }

    await this.git.push(args);
  }

  async pull(options?: GitPullOptions): Promise<void> {
    const args: string[] = [];
    
    if (options?.rebase) {
      args.push('--rebase');
    }
    if (options?.remote) {
      args.push(options.remote);
    }
    if (options?.branch) {
      args.push(options.branch);
    }

    await this.git.pull(args);
  }

  async fetch(remote?: string): Promise<void> {
    if (remote) {
      await this.git.fetch(remote);
    } else {
      await this.git.fetch();
    }
  }

  async stash(options?: GitStashOptions): Promise<void> {
    const args: string[] = ['push'];
    
    if (options?.message) {
      args.push('-m', options.message);
    }
    if (options?.includeUntracked) {
      args.push('-u');
    }

    await this.git.stash(args);
  }

  async stashList(): Promise<GitStash[]> {
    const result = await this.git.stashList();
    
    return result.all.map((stash, index) => ({
      index,
      hash: stash.hash,
      message: stash.message,
      date: stash.date,
    }));
  }

  async stashApply(index: number): Promise<void> {
    await this.git.stash(['apply', `stash@{${index}}`]);
  }

  async stashPop(index: number): Promise<void> {
    await this.git.stash(['pop', `stash@{${index}}`]);
  }

  async stashDrop(index: number): Promise<void> {
    await this.git.stash(['drop', `stash@{${index}}`]);
  }

  async getDiff(file: string, staged?: boolean): Promise<GitDiff> {
    const args = staged ? ['--cached', '--', file] : ['--', file];
    const diffOutput = await this.git.diff(args);
    
    return this.parseDiff(file, diffOutput);
  }

  private parseDiff(file: string, diffOutput: string): GitDiff {
    const hunks: GitDiffHunk[] = [];
    const lines = diffOutput.split('\n');
    
    let currentHunk: GitDiffHunk | null = null;
    let oldLineNum = 0;
    let newLineNum = 0;
    let isNew = false;
    let isDeleted = false;
    let isRenamed = false;
    let isBinary = false;
    let oldFile: string | undefined;

    for (const line of lines) {
      if (line.startsWith('new file')) {
        isNew = true;
      } else if (line.startsWith('deleted file')) {
        isDeleted = true;
      } else if (line.startsWith('rename from')) {
        isRenamed = true;
        oldFile = line.replace('rename from ', '');
      } else if (line.startsWith('Binary files')) {
        isBinary = true;
      } else if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (match) {
          if (currentHunk) {
            hunks.push(currentHunk);
          }
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[3], 10);
          currentHunk = {
            oldStart: oldLineNum,
            oldLines: parseInt(match[2] || '1', 10),
            newStart: newLineNum,
            newLines: parseInt(match[4] || '1', 10),
            lines: [],
          };
        }
      } else if (currentHunk) {
        const diffLine: GitDiffLine = {
          content: line.substring(1),
          type: 'context',
        };

        if (line.startsWith('+')) {
          diffLine.type = 'add';
          diffLine.newLineNumber = newLineNum++;
        } else if (line.startsWith('-')) {
          diffLine.type = 'delete';
          diffLine.oldLineNumber = oldLineNum++;
        } else if (line.startsWith(' ')) {
          diffLine.type = 'context';
          diffLine.oldLineNumber = oldLineNum++;
          diffLine.newLineNumber = newLineNum++;
        }

        currentHunk.lines.push(diffLine);
      }
    }

    if (currentHunk) {
      hunks.push(currentHunk);
    }

    return {
      file,
      oldFile,
      isNew,
      isDeleted,
      isRenamed,
      isBinary,
      hunks,
    };
  }

  async getBlame(file: string): Promise<GitBlame> {
    const blameOutput = await this.git.raw(['blame', '--line-porcelain', file]);
    const lines = blameOutput.split('\n');
    const blameLines: GitBlameLine[] = [];
    
    let currentCommit: Partial<GitBlameLine['commit']> = {};
    let lineNumber = 0;
    let content = '';

    for (const line of lines) {
      if (line.match(/^[a-f0-9]{40}/)) {
        const parts = line.split(' ');
        currentCommit.hash = parts[0];
        currentCommit.hashShort = parts[0].substring(0, 7);
        lineNumber = parseInt(parts[2], 10);
      } else if (line.startsWith('author ')) {
        currentCommit.author = line.replace('author ', '');
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.replace('author-time ', ''), 10);
        currentCommit.date = new Date(timestamp * 1000).toISOString();
      } else if (line.startsWith('summary ')) {
        currentCommit.message = line.replace('summary ', '');
      } else if (line.startsWith('\t')) {
        content = line.substring(1);
        blameLines.push({
          lineNumber,
          content,
          commit: currentCommit as GitBlameLine['commit'],
        });
        currentCommit = {};
      }
    }

    return { lines: blameLines };
  }

  async getFileHistory(file: string): Promise<GitFileHistoryEntry[]> {
    const log = await this.git.log(['--follow', '--numstat', '--', file]);
    
    return log.all.map((commit) => ({
      commit: this.parseCommit(commit),
      changes: {
        insertions: 0,
        deletions: 0,
      },
    }));
  }

  async searchCommits(options: GitSearchOptions): Promise<GitCommit[]> {
    const args: string[] = [`--max-count=${options.maxCount || 50}`];

    switch (options.searchIn) {
      case 'message':
        args.push(`--grep=${options.query}`);
        break;
      case 'author':
        args.push(`--author=${options.query}`);
        break;
      case 'hash':
        args.push(options.query);
        break;
      case 'all':
        args.push(`--grep=${options.query}`, `--author=${options.query}`, '--all-match');
        break;
    }

    try {
      const log = await this.git.log(args);
      return log.all.map((commit) => this.parseCommit(commit));
    } catch {
      return [];
    }
  }

  async discardChanges(files: string[]): Promise<void> {
    await this.git.checkout(['--', ...files]);
  }

  async resolveConflict(
    file: string,
    resolution: 'ours' | 'theirs' | 'manual',
    content?: string
  ): Promise<void> {
    const filePath = path.join(this.repoPath, file);

    if (resolution === 'ours') {
      await this.git.checkout(['--ours', file]);
    } else if (resolution === 'theirs') {
      await this.git.checkout(['--theirs', file]);
    } else if (resolution === 'manual' && content) {
      await fs.writeFile(filePath, content, 'utf-8');
    }

    await this.git.add([file]);
  }

  async getCommitFiles(hash: string): Promise<GitCommitFile[]> {
    // Use git diff-tree to get files changed in a commit
    // For root commits (no parent), compare against empty tree
    const args = ['diff-tree', '--no-commit-id', '--name-status', '-r', hash];
    
    try {
      const result = await this.git.raw(args);
      const lines = result.trim().split('\n').filter(Boolean);
      
      return lines.map((line) => {
        const parts = line.split('\t');
        const statusCode = parts[0];
        
        // Handle renames which have format: R100\toldPath\tnewPath
        if (statusCode.startsWith('R') || statusCode.startsWith('C')) {
          return {
            path: parts[2],
            status: statusCode[0] as GitCommitFile['status'],
            oldPath: parts[1],
          };
        }
        
        return {
          path: parts[1],
          status: statusCode[0] as GitCommitFile['status'],
        };
      });
    } catch (error) {
      console.error('Error fetching commit files:', error);
      return [];
    }
  }

  async getCommitFileDiff(hash: string, file: string): Promise<GitDiff> {
    // Use git show to get the diff for a specific file at a commit
    const args = ['show', '--format=', hash, '--', file];
    
    try {
      const diffOutput = await this.git.raw(args);
      return this.parseDiff(file, diffOutput);
    } catch (error) {
      console.error('Error fetching commit file diff:', error);
      return {
        file,
        isNew: false,
        isDeleted: false,
        isRenamed: false,
        isBinary: false,
        hunks: [],
      };
    }
  }
}

