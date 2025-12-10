import { useCallback } from 'react';
import { useRepositoryStore } from '../stores/repository.store';
import { useCommitsStore } from '../stores/commits.store';
import { useBranchesStore } from '../stores/branches.store';
import { useUIStore } from '../stores/ui.store';

export function useGit() {
  const { refreshStatus } = useRepositoryStore();
  const { fetchCommits } = useCommitsStore();
  const { fetchBranches, fetchStashes } = useBranchesStore();
  const { showNotification } = useUIStore();

  const refresh = useCallback(async () => {
    await Promise.all([
      refreshStatus(),
      fetchCommits(),
      fetchBranches(),
      fetchStashes(),
    ]);
  }, [refreshStatus, fetchCommits, fetchBranches, fetchStashes]);

  const stageFiles = useCallback(async (files: string[]) => {
    const response = await window.electronAPI.git.stage(files);
    if (response.success) {
      await refreshStatus();
      showNotification('success', `Staged ${files.length} file(s)`);
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refreshStatus, showNotification]);

  const unstageFiles = useCallback(async (files: string[]) => {
    const response = await window.electronAPI.git.unstage(files);
    if (response.success) {
      await refreshStatus();
      showNotification('success', `Unstaged ${files.length} file(s)`);
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refreshStatus, showNotification]);

  const commit = useCallback(async (message: string) => {
    const response = await window.electronAPI.git.commit(message);
    if (response.success) {
      await refresh();
      showNotification('success', 'Commit created successfully');
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refresh, showNotification]);

  const push = useCallback(async () => {
    const response = await window.electronAPI.git.push();
    if (response.success) {
      await refreshStatus();
      showNotification('success', 'Pushed successfully');
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refreshStatus, showNotification]);

  const pull = useCallback(async () => {
    const response = await window.electronAPI.git.pull();
    if (response.success) {
      await refresh();
      showNotification('success', 'Pulled successfully');
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refresh, showNotification]);

  const fetch = useCallback(async () => {
    const response = await window.electronAPI.git.fetch();
    if (response.success) {
      await refreshStatus();
      showNotification('success', 'Fetched successfully');
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refreshStatus, showNotification]);

  const createBranch = useCallback(async (name: string, startPoint?: string) => {
    const response = await window.electronAPI.git.createBranch(name, startPoint);
    if (response.success) {
      await fetchBranches();
      showNotification('success', `Created branch ${name}`);
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [fetchBranches, showNotification]);

  const checkout = useCallback(async (branch: string) => {
    const response = await window.electronAPI.git.checkout(branch);
    if (response.success) {
      await refresh();
      showNotification('success', `Switched to ${branch}`);
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refresh, showNotification]);

  const stash = useCallback(async (message?: string) => {
    const response = await window.electronAPI.git.stash({ message });
    if (response.success) {
      await Promise.all([refreshStatus(), fetchStashes()]);
      showNotification('success', 'Changes stashed');
    } else {
      showNotification('error', response.error);
    }
    return response.success;
  }, [refreshStatus, fetchStashes, showNotification]);

  return {
    refresh,
    stageFiles,
    unstageFiles,
    commit,
    push,
    pull,
    fetch,
    createBranch,
    checkout,
    stash,
  };
}

