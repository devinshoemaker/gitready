import { useEffect, useState } from 'react';
import { useUIStore } from '../../stores/ui.store';
import type { GitFileHistoryEntry } from '../../../shared/types/git.types';

export function FileHistory() {
  const { selectedFile } = useUIStore();
  const [history, setHistory] = useState<GitFileHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<GitFileHistoryEntry | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    const loadHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await window.electronAPI.git.fileHistory(selectedFile);
        if (response.success) {
          setHistory(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError((err as Error).message);
      }
      setIsLoading(false);
    };

    loadHistory();
  }, [selectedFile]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Select a file to view history</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-gk-accent-magenta">
        <div className="text-center">
          <p>Error loading history</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <p>No history available for this file</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gk-bg-secondary border-b border-gk-border">
        <svg className="w-5 h-5 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-mono text-sm text-gk-text">{selectedFile}</span>
        <span className="text-xs text-gk-text-muted">
          {history.length} commits
        </span>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-auto">
        {history.map((entry, index) => {
          const isSelected = selectedEntry?.commit.hash === entry.commit.hash;

          return (
            <div
              key={entry.commit.hash}
              onClick={() => setSelectedEntry(entry)}
              className={`
                flex items-start gap-4 px-4 py-3 cursor-pointer border-b border-gk-border
                ${isSelected ? 'bg-gk-accent-cyan/10' : 'hover:bg-gk-bg-secondary/50'}
              `}
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-gk-accent-cyan' : 'bg-gk-text-muted'}`} />
                {index < history.length - 1 && (
                  <div className="w-0.5 flex-1 mt-1 bg-gk-border" />
                )}
              </div>

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-gk-accent-cyan">
                    {entry.commit.hashShort}
                  </span>
                  <span className="text-xs text-gk-text-muted">
                    {formatDate(entry.commit.author.date)}
                  </span>
                </div>
                <p className="text-sm text-gk-text mb-1 truncate">
                  {entry.commit.message}
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gk-text-muted">{entry.commit.author.name}</span>
                  {entry.changes && (
                    <span className="flex items-center gap-1">
                      <span className="text-gk-accent-green">+{entry.changes.insertions}</span>
                      <span className="text-gk-accent-magenta">-{entry.changes.deletions}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  className="p-1 rounded hover:bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-text"
                  title="View diff"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  className="p-1 rounded hover:bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-text"
                  title="Restore this version"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

