import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock simple-git
const mockGit = {
  checkIsRepo: vi.fn(),
  branchLocal: vi.fn(),
  branch: vi.fn(),
  getRemotes: vi.fn(),
  status: vi.fn(),
  log: vi.fn(),
  add: vi.fn(),
  reset: vi.fn(),
  commit: vi.fn(),
  checkout: vi.fn(),
  checkoutBranch: vi.fn(),
  checkoutLocalBranch: vi.fn(),
  merge: vi.fn(),
  rebase: vi.fn(),
  push: vi.fn(),
  pull: vi.fn(),
  fetch: vi.fn(),
  stash: vi.fn(),
  stashList: vi.fn(),
  diff: vi.fn(),
  raw: vi.fn(),
};

vi.mock('simple-git', () => ({
  default: () => mockGit,
}));

// Import after mocking
import { GitService } from '../../../src/main/services/git.service';

describe('GitService', () => {
  let gitService: GitService;

  beforeEach(() => {
    vi.clearAllMocks();
    gitService = new GitService('/test/repo');
  });

  describe('getRepositoryInfo', () => {
    it('should return repository info for valid git repo', async () => {
      mockGit.checkIsRepo.mockResolvedValue(true);
      mockGit.branchLocal.mockResolvedValue({ current: 'main' });
      mockGit.getRemotes.mockResolvedValue([
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git', push: 'https://github.com/user/repo.git' } },
      ]);

      const result = await gitService.getRepositoryInfo();

      expect(result).toEqual({
        path: '/test/repo',
        name: 'repo',
        isGitRepo: true,
        currentBranch: 'main',
        remotes: [
          {
            name: 'origin',
            fetchUrl: 'https://github.com/user/repo.git',
            pushUrl: 'https://github.com/user/repo.git',
          },
        ],
      });
    });

    it('should throw error for non-git directory', async () => {
      mockGit.checkIsRepo.mockResolvedValue(false);

      await expect(gitService.getRepositoryInfo()).rejects.toThrow('Not a git repository');
    });
  });

  describe('getStatus', () => {
    it('should return parsed status', async () => {
      mockGit.status.mockResolvedValue({
        current: 'main',
        tracking: 'origin/main',
        ahead: 2,
        behind: 1,
        files: [
          { path: 'file1.ts', index: 'M', working_dir: ' ' },
          { path: 'file2.ts', index: ' ', working_dir: 'M' },
          { path: 'file3.ts', index: '?', working_dir: '?' },
        ],
        created: [],
        deleted: [],
        modified: ['file1.ts', 'file2.ts'],
        renamed: [],
        isClean: () => false,
      });

      const result = await gitService.getStatus();

      expect(result.current).toBe('main');
      expect(result.tracking).toBe('origin/main');
      expect(result.ahead).toBe(2);
      expect(result.behind).toBe(1);
      expect(result.staged).toHaveLength(1);
      expect(result.unstaged).toHaveLength(2);
      expect(result.isClean).toBe(false);
    });

    it('should identify conflicted files', async () => {
      mockGit.status.mockResolvedValue({
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        files: [
          { path: 'conflict.ts', index: 'U', working_dir: 'U' },
        ],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: () => false,
      });

      const result = await gitService.getStatus();

      expect(result.conflicted).toHaveLength(1);
      expect(result.conflicted[0].isConflicted).toBe(true);
    });
  });

  describe('getLog', () => {
    it('should return parsed commits', async () => {
      mockGit.raw.mockResolvedValue(
        'abc123def456|abc123d|Test commit|Test User|test@example.com|2024-01-01T12:00:00Z|parent123|HEAD -> main'
      );

      const result = await gitService.getLog();

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe('abc123def456');
      expect(result[0].hashShort).toBe('abc123d');
      expect(result[0].message).toBe('Test commit');
      expect(result[0].author.name).toBe('Test User');
    });

    it('should respect maxCount option', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.getLog({ maxCount: 50 });

      expect(mockGit.raw).toHaveBeenCalledWith(
        expect.arrayContaining(['--max-count=50'])
      );
    });

    it('should include all branches', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.getLog();

      expect(mockGit.raw).toHaveBeenCalledWith(
        expect.arrayContaining(['--all'])
      );
    });
  });

  describe('getBranches', () => {
    it('should return local and remote branches', async () => {
      mockGit.branchLocal.mockResolvedValue({
        current: 'main',
        branches: {
          main: { current: true, commit: 'abc123' },
          develop: { current: false, commit: 'def456' },
        },
      });
      mockGit.branch.mockResolvedValue({
        branches: {
          'origin/main': { current: false, commit: 'abc123' },
        },
      });

      const result = await gitService.getBranches();

      expect(result).toHaveLength(3);
      expect(result.filter((b) => !b.isRemote)).toHaveLength(2);
      expect(result.filter((b) => b.isRemote)).toHaveLength(1);
    });
  });

  describe('stage and unstage', () => {
    it('should stage files', async () => {
      mockGit.add.mockResolvedValue(undefined);

      await gitService.stage(['file1.ts', 'file2.ts']);

      expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts']);
    });

    it('should unstage files', async () => {
      mockGit.reset.mockResolvedValue(undefined);

      await gitService.unstage(['file1.ts']);

      expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', '--', 'file1.ts']);
    });
  });

  describe('commit', () => {
    it('should create commit and return hash', async () => {
      mockGit.commit.mockResolvedValue({ commit: 'abc123' });

      const result = await gitService.commit('Test message');

      expect(result).toBe('abc123');
      expect(mockGit.commit).toHaveBeenCalledWith('Test message');
    });
  });

  describe('branch operations', () => {
    it('should checkout branch', async () => {
      mockGit.checkout.mockResolvedValue(undefined);

      await gitService.checkout('develop');

      expect(mockGit.checkout).toHaveBeenCalledWith('develop');
    });

    it('should create branch from current HEAD', async () => {
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined);

      await gitService.createBranch('feature/new');

      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith('feature/new');
    });

    it('should create branch from start point', async () => {
      mockGit.checkoutBranch.mockResolvedValue(undefined);

      await gitService.createBranch('feature/new', 'develop');

      expect(mockGit.checkoutBranch).toHaveBeenCalledWith('feature/new', 'develop');
    });

    it('should delete branch', async () => {
      mockGit.branch.mockResolvedValue(undefined);

      await gitService.deleteBranch('feature/old');

      expect(mockGit.branch).toHaveBeenCalledWith(['-d', 'feature/old']);
    });

    it('should force delete branch', async () => {
      mockGit.branch.mockResolvedValue(undefined);

      await gitService.deleteBranch('feature/old', true);

      expect(mockGit.branch).toHaveBeenCalledWith(['-D', 'feature/old']);
    });
  });

  describe('merge', () => {
    it('should return success for clean merge', async () => {
      mockGit.merge.mockResolvedValue(undefined);

      const result = await gitService.merge('feature/branch');

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should return conflicts on merge failure', async () => {
      mockGit.merge.mockRejectedValue(new Error('Merge conflict'));
      mockGit.status.mockResolvedValue({
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
        files: [{ path: 'conflict.ts', index: 'U', working_dir: 'U' }],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: () => false,
      });

      const result = await gitService.merge('feature/branch');

      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('conflict.ts');
    });
  });

  describe('rebase', () => {
    it('should return success for clean rebase', async () => {
      mockGit.rebase.mockResolvedValue(undefined);

      const result = await gitService.rebase('main');

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(0);
      expect(mockGit.rebase).toHaveBeenCalledWith(['main']);
    });

    it('should return conflicts on rebase failure', async () => {
      mockGit.rebase.mockRejectedValue(new Error('Rebase conflict'));
      mockGit.status.mockResolvedValue({
        current: 'feature',
        tracking: null,
        ahead: 0,
        behind: 0,
        files: [{ path: 'conflict.ts', index: 'U', working_dir: 'U' }],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        isClean: () => false,
      });

      const result = await gitService.rebase('main');

      expect(result.success).toBe(false);
      expect(result.conflicts).toContain('conflict.ts');
      expect(result.message).toBe('Rebase conflict');
    });
  });

  describe('remote operations', () => {
    it('should push with options', async () => {
      mockGit.push.mockResolvedValue(undefined);

      await gitService.push({ setUpstream: true, remote: 'origin', branch: 'main' });

      expect(mockGit.push).toHaveBeenCalledWith(['-u', 'origin', 'main']);
    });

    it('should pull with rebase', async () => {
      mockGit.pull.mockResolvedValue(undefined);

      await gitService.pull({ rebase: true });

      expect(mockGit.pull).toHaveBeenCalledWith(['--rebase']);
    });

    it('should fetch all remotes', async () => {
      mockGit.fetch.mockResolvedValue(undefined);

      await gitService.fetch();

      expect(mockGit.fetch).toHaveBeenCalledWith();
    });

    it('should fetch specific remote', async () => {
      mockGit.fetch.mockResolvedValue(undefined);

      await gitService.fetch('upstream');

      expect(mockGit.fetch).toHaveBeenCalledWith('upstream');
    });
  });

  describe('stash operations', () => {
    it('should create stash', async () => {
      mockGit.stash.mockResolvedValue(undefined);

      await gitService.stash({ message: 'WIP', includeUntracked: true });

      expect(mockGit.stash).toHaveBeenCalledWith(['push', '-m', 'WIP', '-u']);
    });

    it('should list stashes', async () => {
      mockGit.stashList.mockResolvedValue({
        all: [
          { hash: 'abc123', message: 'WIP: feature', date: '2024-01-01' },
        ],
      });

      const result = await gitService.stashList();

      expect(result).toHaveLength(1);
      expect(result[0].index).toBe(0);
      expect(result[0].message).toBe('WIP: feature');
    });

    it('should apply stash', async () => {
      mockGit.stash.mockResolvedValue(undefined);

      await gitService.stashApply(0);

      expect(mockGit.stash).toHaveBeenCalledWith(['apply', 'stash@{0}']);
    });

    it('should pop stash', async () => {
      mockGit.stash.mockResolvedValue(undefined);

      await gitService.stashPop(1);

      expect(mockGit.stash).toHaveBeenCalledWith(['pop', 'stash@{1}']);
    });

    it('should drop stash', async () => {
      mockGit.stash.mockResolvedValue(undefined);

      await gitService.stashDrop(2);

      expect(mockGit.stash).toHaveBeenCalledWith(['drop', 'stash@{2}']);
    });
  });

  describe('getDiff', () => {
    it('should parse unified diff', async () => {
      mockGit.diff.mockResolvedValue(`
diff --git a/file.ts b/file.ts
index abc123..def456 100644
--- a/file.ts
+++ b/file.ts
@@ -1,3 +1,4 @@
 line 1
+new line
 line 2
 line 3
`);

      const result = await gitService.getDiff('file.ts');

      expect(result.file).toBe('file.ts');
      expect(result.hunks).toHaveLength(1);
      expect(result.hunks[0].lines.some((l) => l.type === 'add')).toBe(true);
    });

    it('should detect new files', async () => {
      mockGit.diff.mockResolvedValue(`
diff --git a/new.ts b/new.ts
new file mode 100644
index 0000000..abc123
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,2 @@
+line 1
+line 2
`);

      const result = await gitService.getDiff('new.ts');

      expect(result.isNew).toBe(true);
    });

    it('should detect deleted files', async () => {
      mockGit.diff.mockResolvedValue(`
diff --git a/old.ts b/old.ts
deleted file mode 100644
index abc123..0000000
--- a/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-line 1
-line 2
`);

      const result = await gitService.getDiff('old.ts');

      expect(result.isDeleted).toBe(true);
    });
  });

  describe('getBlame', () => {
    it('should parse blame output', async () => {
      mockGit.raw.mockResolvedValue(`abc123def456789012345678901234567890123456 1 1 1
author Test User
author-mail <test@example.com>
author-time 1704067200
author-tz +0000
committer Test User
committer-mail <test@example.com>
committer-time 1704067200
committer-tz +0000
summary Test commit
filename test.ts
\tconst x = 1;
`);

      const result = await gitService.getBlame('test.ts');

      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].commit.author).toBe('Test User');
      expect(result.lines[0].content).toBe('const x = 1;');
    });
  });

  describe('searchCommits', () => {
    it('should search by message', async () => {
      mockGit.log.mockResolvedValue({ all: [] });

      await gitService.searchCommits({ query: 'fix', searchIn: 'message' });

      expect(mockGit.log).toHaveBeenCalledWith(
        expect.arrayContaining(['--grep=fix'])
      );
    });

    it('should search by author', async () => {
      mockGit.log.mockResolvedValue({ all: [] });

      await gitService.searchCommits({ query: 'john', searchIn: 'author' });

      expect(mockGit.log).toHaveBeenCalledWith(
        expect.arrayContaining(['--author=john'])
      );
    });

    it('should return empty array on error', async () => {
      mockGit.log.mockRejectedValue(new Error('Not found'));

      const result = await gitService.searchCommits({ query: 'xyz', searchIn: 'hash' });

      expect(result).toEqual([]);
    });
  });

  describe('discardChanges', () => {
    it('should checkout files to discard changes', async () => {
      mockGit.checkout.mockResolvedValue(undefined);

      await gitService.discardChanges(['file1.ts', 'file2.ts']);

      expect(mockGit.checkout).toHaveBeenCalledWith(['--', 'file1.ts', 'file2.ts']);
    });
  });

  describe('getCommitFiles', () => {
    it('should parse modified files', async () => {
      mockGit.raw.mockResolvedValue(`M\tsrc/app.ts
A\tsrc/new-file.ts
D\tsrc/deleted.ts
`);

      const result = await gitService.getCommitFiles('abc123');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ path: 'src/app.ts', status: 'M' });
      expect(result[1]).toEqual({ path: 'src/new-file.ts', status: 'A' });
      expect(result[2]).toEqual({ path: 'src/deleted.ts', status: 'D' });
    });

    it('should parse renamed files with old path', async () => {
      mockGit.raw.mockResolvedValue(`R100\tsrc/old-name.ts\tsrc/new-name.ts
`);

      const result = await gitService.getCommitFiles('abc123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        path: 'src/new-name.ts',
        status: 'R',
        oldPath: 'src/old-name.ts',
      });
    });

    it('should parse copied files', async () => {
      mockGit.raw.mockResolvedValue(`C100\tsrc/original.ts\tsrc/copy.ts
`);

      const result = await gitService.getCommitFiles('abc123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        path: 'src/copy.ts',
        status: 'C',
        oldPath: 'src/original.ts',
      });
    });

    it('should return empty array on error', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      const result = await gitService.getCommitFiles('abc123');

      expect(result).toEqual([]);
    });

    it('should call git with correct arguments', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.getCommitFiles('def456');

      expect(mockGit.raw).toHaveBeenCalledWith([
        'diff-tree',
        '--no-commit-id',
        '--name-status',
        '-r',
        'def456',
      ]);
    });
  });

  describe('getCommitFileDiff', () => {
    it('should parse commit file diff', async () => {
      mockGit.raw.mockResolvedValue(
        'diff --git a/file.ts b/file.ts\n' +
        'index abc123..def456 100644\n' +
        '--- a/file.ts\n' +
        '+++ b/file.ts\n' +
        '@@ -1,3 +1,4 @@\n' +
        ' line 1\n' +
        '-old line\n' +
        '+new line\n' +
        '+another line\n' +
        ' line 3'
      );

      const result = await gitService.getCommitFileDiff('abc123', 'file.ts');

      expect(result.file).toBe('file.ts');
      expect(result.hunks).toHaveLength(1);
      expect(result.hunks[0].lines).toHaveLength(5);
    });

    it('should detect new files in commit', async () => {
      mockGit.raw.mockResolvedValue(`
diff --git a/new.ts b/new.ts
new file mode 100644
index 0000000..abc123
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,2 @@
+line 1
+line 2
`);

      const result = await gitService.getCommitFileDiff('abc123', 'new.ts');

      expect(result.isNew).toBe(true);
    });

    it('should detect deleted files in commit', async () => {
      mockGit.raw.mockResolvedValue(`
diff --git a/old.ts b/old.ts
deleted file mode 100644
index abc123..0000000
--- a/old.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-line 1
-line 2
`);

      const result = await gitService.getCommitFileDiff('abc123', 'old.ts');

      expect(result.isDeleted).toBe(true);
    });

    it('should call git show with correct arguments', async () => {
      mockGit.raw.mockResolvedValue('');

      await gitService.getCommitFileDiff('def456', 'src/app.ts');

      expect(mockGit.raw).toHaveBeenCalledWith([
        'show',
        '--format=',
        'def456',
        '--',
        'src/app.ts',
      ]);
    });

    it('should return empty diff on error', async () => {
      mockGit.raw.mockRejectedValue(new Error('Git error'));

      const result = await gitService.getCommitFileDiff('abc123', 'file.ts');

      expect(result.file).toBe('file.ts');
      expect(result.hunks).toEqual([]);
    });
  });
});

