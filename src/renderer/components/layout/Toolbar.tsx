import React, { useState } from 'react';
import { useRepositoryStore } from '../../stores/repository.store';
import { useBranchesStore } from '../../stores/branches.store';
import { useUIStore } from '../../stores/ui.store';

export function Toolbar() {
  const repository = useRepositoryStore((state) => state.repository);
  const status = useRepositoryStore((state) => state.status);
  const currentBranch = useBranchesStore((state) => state.currentBranch);
  const { toggleSearch, showNotification } = useUIStore();
  
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const handlePush = async () => {
    setIsPushing(true);
    try {
      const response = await window.electronAPI.git.push();
      if (response.success) {
        showNotification('success', 'Push completed successfully');
      } else {
        showNotification('error', response.error);
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
    setIsPushing(false);
  };

  const handlePull = async () => {
    setIsPulling(true);
    try {
      const response = await window.electronAPI.git.pull();
      if (response.success) {
        showNotification('success', 'Pull completed successfully');
      } else {
        showNotification('error', response.error);
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
    setIsPulling(false);
  };

  const handleFetch = async () => {
    setIsFetching(true);
    try {
      const response = await window.electronAPI.git.fetch();
      if (response.success) {
        showNotification('success', 'Fetch completed successfully');
      } else {
        showNotification('error', response.error);
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
    setIsFetching(false);
  };

  return (
    <div className="h-14 bg-gk-bg-secondary border-b border-gk-border flex items-center px-4 gap-4 drag-region">
      {/* Repository name */}
      <div className="flex items-center gap-2 no-drag">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gk-accent-cyan to-gk-accent-magenta p-0.5">
          <div className="w-full h-full rounded-md bg-gk-bg-secondary flex items-center justify-center">
            <svg className="w-4 h-4 text-gk-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-gk-text">{repository?.name}</div>
          <div className="text-xs text-gk-text-muted">{currentBranch || 'No branch'}</div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-gk-border" />

      {/* Git actions */}
      <div className="flex items-center gap-2 no-drag">
        {/* Pull */}
        <button
          onClick={handlePull}
          disabled={isPulling}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Pull"
        >
          {isPulling ? (
            <div className="spinner w-4 h-4" />
          ) : (
            <svg className="w-4 h-4 text-gk-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className="text-sm text-gk-text">Pull</span>
          {status && status.behind > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-orange/20 text-gk-accent-orange">
              {status.behind}
            </span>
          )}
        </button>

        {/* Push */}
        <button
          onClick={handlePush}
          disabled={isPushing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Push"
        >
          {isPushing ? (
            <div className="spinner w-4 h-4" />
          ) : (
            <svg className="w-4 h-4 text-gk-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
          <span className="text-sm text-gk-text">Push</span>
          {status && status.ahead > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-cyan/20 text-gk-accent-cyan">
              {status.ahead}
            </span>
          )}
        </button>

        {/* Fetch */}
        <button
          onClick={handleFetch}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Fetch"
        >
          {isFetching ? (
            <div className="spinner w-4 h-4" />
          ) : (
            <svg className="w-4 h-4 text-gk-accent-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
          <span className="text-sm text-gk-text">Fetch</span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2 no-drag">
        {/* Search */}
        <button
          onClick={toggleSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Search (Cmd+K)"
        >
          <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm text-gk-text-muted">Search</span>
          <kbd className="px-1.5 py-0.5 text-xs rounded bg-gk-bg-tertiary text-gk-text-muted">⌘K</kbd>
        </button>

        {/* Stash */}
        <button
          className="p-2 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Stash changes"
        >
          <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Settings"
        >
          <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

