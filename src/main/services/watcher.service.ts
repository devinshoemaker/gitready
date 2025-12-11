import chokidar, { FSWatcher } from 'chokidar';
import path from 'path';
import { APP_CONFIG } from '../../shared/constants';

export class WatcherService {
  private watcher: FSWatcher;
  private debounceTimer: NodeJS.Timeout | null = null;
  private callback: () => void;

  constructor(repoPath: string, onChange: () => void) {
    this.callback = onChange;

    // Watch the repository for changes, excluding .git internals except for specific files
    this.watcher = chokidar.watch(repoPath, {
      ignored: [
        /(^|[/\\])\.\./, // Ignore dotfiles except .git
        /node_modules/,
        '**/node_modules/**',
        '**/.git/objects/**',
        '**/.git/logs/**',
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    // Also watch specific git files that indicate state changes
    const gitPath = path.join(repoPath, '.git');
    this.watcher.add([
      path.join(gitPath, 'HEAD'),
      path.join(gitPath, 'index'),
      path.join(gitPath, 'FETCH_HEAD'),
      path.join(gitPath, 'refs'),
      path.join(gitPath, 'stash'),
    ]);

    this.watcher
      .on('add', () => this.handleChange())
      .on('change', () => this.handleChange())
      .on('unlink', () => this.handleChange())
      .on('addDir', () => this.handleChange())
      .on('unlinkDir', () => this.handleChange());
  }

  private handleChange(): void {
    // Debounce the change events
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.callback();
    }, APP_CONFIG.DEBOUNCE_FILE_WATCH);
  }

  close(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.watcher.close();
  }
}

