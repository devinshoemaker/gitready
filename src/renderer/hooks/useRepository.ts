import { useEffect } from 'react';
import { useRepositoryStore } from '../stores/repository.store';
import { useCommitsStore } from '../stores/commits.store';
import { useBranchesStore } from '../stores/branches.store';

export function useRepository() {
  const {
    repository,
    status,
    isLoading,
    error,
    openRepository,
    refreshStatus,
  } = useRepositoryStore();

  const { fetchCommits } = useCommitsStore();
  const { fetchBranches, fetchStashes } = useBranchesStore();

  // Set up file watcher listener
  useEffect(() => {
    if (!repository) return;

    const unsubscribe = window.electronAPI.onRepoChange(async (event) => {
      switch (event.type) {
        case 'status':
          await refreshStatus();
          break;
        case 'branch':
          await fetchBranches();
          break;
        case 'commit':
          await fetchCommits();
          break;
        case 'stash':
          await fetchStashes();
          break;
        default:
          // Refresh everything
          await Promise.all([
            refreshStatus(),
            fetchCommits(),
            fetchBranches(),
            fetchStashes(),
          ]);
      }
    });

    return unsubscribe;
  }, [repository, refreshStatus, fetchCommits, fetchBranches, fetchStashes]);

  // Initial data load
  useEffect(() => {
    if (!repository) return;

    const loadInitialData = async () => {
      await Promise.all([
        refreshStatus(),
        fetchCommits(),
        fetchBranches(),
        fetchStashes(),
      ]);
    };

    loadInitialData();
  }, [repository, refreshStatus, fetchCommits, fetchBranches, fetchStashes]);

  return {
    repository,
    status,
    isLoading,
    error,
    openRepository,
    refreshStatus,
    isClean: status?.isClean ?? true,
    hasChanges: status ? !status.isClean : false,
    hasStagedChanges: status ? status.staged.length > 0 : false,
    hasUnstagedChanges: status ? status.unstaged.length > 0 : false,
    hasConflicts: status ? status.conflicted.length > 0 : false,
  };
}

