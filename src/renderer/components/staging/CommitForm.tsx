import React, { useState } from 'react';
import { useRepositoryStore } from '../../stores/repository.store';
import { useCommitsStore } from '../../stores/commits.store';
import { useUIStore } from '../../stores/ui.store';

export function CommitForm() {
  const status = useRepositoryStore((state) => state.status);
  const refreshStatus = useRepositoryStore((state) => state.refreshStatus);
  const fetchCommits = useCommitsStore((state) => state.fetchCommits);
  const { showNotification } = useUIStore();

  const [message, setMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);

  const canCommit = status && status.staged.length > 0 && message.trim().length > 0;

  const handleCommit = async () => {
    if (!canCommit) return;

    setIsCommitting(true);
    try {
      const response = await window.electronAPI.git.commit(message.trim());
      if (response.success) {
        setMessage('');
        showNotification('success', `Committed: ${message.trim().substring(0, 50)}`);
        await refreshStatus();
        await fetchCommits();
      } else {
        showNotification('error', response.error);
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
    setIsCommitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleCommit();
    }
  };

  return (
    <div className="p-4 space-y-3">
      {/* Commit message input */}
      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Commit message..."
          className="input resize-none h-20 font-mono text-sm"
          disabled={isCommitting}
        />
        <div className="flex items-center justify-between text-xs text-gk-text-muted">
          <span>{message.length} characters</span>
          <span>⌘+Enter to commit</span>
        </div>
      </div>

      {/* Commit button */}
      <button
        onClick={handleCommit}
        disabled={!canCommit || isCommitting}
        className={`
          w-full py-2 rounded-lg font-medium transition-all duration-200
          ${canCommit
            ? 'bg-gk-accent-cyan text-gk-bg hover:bg-cyan-400'
            : 'bg-gk-bg-tertiary text-gk-text-muted cursor-not-allowed'
          }
        `}
      >
        {isCommitting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="spinner w-4 h-4 border-gk-bg" />
            Committing...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Commit {status?.staged.length || 0} files
          </span>
        )}
      </button>

      {/* Quick commit types */}
      <div className="flex flex-wrap gap-2">
        {['feat:', 'fix:', 'docs:', 'style:', 'refactor:', 'test:', 'chore:'].map((prefix) => (
          <button
            key={prefix}
            onClick={() => setMessage(prefix + ' ' + message.replace(/^[a-z]+:\s*/i, ''))}
            className="px-2 py-1 text-xs rounded bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-text hover:bg-gk-bg-secondary transition-colors"
          >
            {prefix}
          </button>
        ))}
      </div>
    </div>
  );
}

