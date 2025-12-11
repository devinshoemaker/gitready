import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { GitService } from './services/git.service';
import { WatcherService } from './services/watcher.service';
import { IPC_CHANNELS } from '../shared/types/ipc.types';
import type {
  GitLogOptions,
  GitSearchOptions,
  GitPushOptions,
  GitPullOptions,
  GitStashOptions,
} from '../shared/types/ipc.types';

let mainWindow: BrowserWindow | null = null;
let gitService: GitService | null = null;
let watcherService: WatcherService | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupIpcHandlers() {
  // Dialog handlers
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIRECTORY, async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // Git handlers
  ipcMain.handle(IPC_CHANNELS.GIT_OPEN_REPO, async (_, repoPath: string) => {
    try {
      gitService = new GitService(repoPath);
      const info = await gitService.getRepositoryInfo();
      
      // Set up file watcher
      if (watcherService) {
        watcherService.close();
      }
      watcherService = new WatcherService(repoPath, () => {
        mainWindow?.webContents.send(IPC_CHANNELS.REPO_CHANGED, {
          type: 'status',
          path: repoPath,
        });
      });
      
      return { success: true, data: info };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_CLOSE_REPO, async () => {
    try {
      if (watcherService) {
        watcherService.close();
        watcherService = null;
      }
      gitService = null;
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_STATUS, async () => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const status = await gitService.getStatus();
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_LOG, async (_, options?: GitLogOptions) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const log = await gitService.getLog(options);
      return { success: true, data: log };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_GET_BRANCHES, async () => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const branches = await gitService.getBranches();
      return { success: true, data: branches };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STAGE, async (_, files: string[]) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.stage(files);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_UNSTAGE, async (_, files: string[]) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.unstage(files);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_COMMIT, async (_, message: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const hash = await gitService.commit(message);
      return { success: true, data: hash };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_CHECKOUT, async (_, branch: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.checkout(branch);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_CREATE_BRANCH, async (_, name: string, startPoint?: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.createBranch(name, startPoint);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_DELETE_BRANCH, async (_, name: string, force?: boolean) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.deleteBranch(name, force);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_RENAME_BRANCH, async (_, oldName: string, newName: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.renameBranch(oldName, newName);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_MERGE, async (_, branch: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const result = await gitService.merge(branch);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PUSH, async (_, options?: GitPushOptions) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.push(options);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_PULL, async (_, options?: GitPullOptions) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.pull(options);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_FETCH, async (_, remote?: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.fetch(remote);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STASH, async (_, options?: GitStashOptions) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.stash(options);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STASH_LIST, async () => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const stashes = await gitService.stashList();
      return { success: true, data: stashes };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STASH_APPLY, async (_, index: number) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.stashApply(index);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STASH_POP, async (_, index: number) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.stashPop(index);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_STASH_DROP, async (_, index: number) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.stashDrop(index);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_DIFF, async (_, file: string, staged?: boolean) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const diff = await gitService.getDiff(file, staged);
      return { success: true, data: diff };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_BLAME, async (_, file: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const blame = await gitService.getBlame(file);
      return { success: true, data: blame };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_FILE_HISTORY, async (_, file: string) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const history = await gitService.getFileHistory(file);
      return { success: true, data: history };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_SEARCH_COMMITS, async (_, options: GitSearchOptions) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      const commits = await gitService.searchCommits(options);
      return { success: true, data: commits };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.GIT_DISCARD_CHANGES, async (_, files: string[]) => {
    try {
      if (!gitService) throw new Error('No repository opened');
      await gitService.discardChanges(files);
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(
    IPC_CHANNELS.GIT_RESOLVE_CONFLICT,
    async (_, file: string, resolution: 'ours' | 'theirs' | 'manual', content?: string) => {
      try {
        if (!gitService) throw new Error('No repository opened');
        await gitService.resolveConflict(file, resolution, content);
        return { success: true, data: undefined };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    }
  );

  // File handlers
  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_, filePath: string) => {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FILE_WRITE, async (_, filePath: string, content: string) => {
    try {
      const fs = await import('fs/promises');
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, data: undefined };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (watcherService) {
    watcherService.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

