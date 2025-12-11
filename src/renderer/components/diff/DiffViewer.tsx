import { useEffect, useState, useCallback } from 'react';
import { useUIStore } from '../../stores/ui.store';
import { useRepositoryStore } from '../../stores/repository.store';
import { DiffLine } from './DiffLine';
import type { GitDiff } from '../../../shared/types/git.types';

export function DiffViewer() {
  const { selectedFile, diffViewMode, setDiffViewMode } = useUIStore();
  const status = useRepositoryStore((state) => state.status);
  const [diff, setDiff] = useState<GitDiff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if file is staged
  const isStaged = status?.staged.some((f) => f.path === selectedFile) || false;

  const loadDiff = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await window.electronAPI.git.diff(selectedFile, isStaged);
      if (response.success) {
        setDiff(response.data);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError((err as Error).message);
    }
    setIsLoading(false);
  }, [selectedFile, isStaged]);

  // Load diff when file or staged status changes
  useEffect(() => {
    loadDiff();
  }, [loadDiff]);

  // Refresh diff when window gains focus
  useEffect(() => {
    if (!selectedFile) return;

    const handleFocus = () => {
      loadDiff();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDiff();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedFile, loadDiff]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>Select a file to view diff</p>
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
          <p>Error loading diff</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!diff || (!diff.isBinary && diff.hunks.length === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No changes in this file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gk-bg-secondary border-b border-gk-border">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-mono text-sm text-gk-text">{selectedFile}</span>
          {diff.isNew && (
            <span className="px-2 py-0.5 text-xs rounded bg-gk-accent-green/20 text-gk-accent-green">New</span>
          )}
          {diff.isDeleted && (
            <span className="px-2 py-0.5 text-xs rounded bg-gk-accent-magenta/20 text-gk-accent-magenta">Deleted</span>
          )}
          {diff.isRenamed && (
            <span className="px-2 py-0.5 text-xs rounded bg-gk-accent-purple/20 text-gk-accent-purple">Renamed</span>
          )}
          {diff.isBinary && (
            <span className="px-2 py-0.5 text-xs rounded bg-gk-accent-orange/20 text-gk-accent-orange">Binary</span>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-gk-bg">
          <button
            onClick={() => setDiffViewMode('unified')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              diffViewMode === 'unified'
                ? 'bg-gk-accent-cyan/20 text-gk-accent-cyan'
                : 'text-gk-text-muted hover:text-gk-text'
            }`}
          >
            Unified
          </button>
          <button
            onClick={() => setDiffViewMode('split')}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              diffViewMode === 'split'
                ? 'bg-gk-accent-cyan/20 text-gk-accent-cyan'
                : 'text-gk-text-muted hover:text-gk-text'
            }`}
          >
            Split
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className="flex-1 overflow-auto">
        {diff.isBinary ? (
          <div className="flex items-center justify-center h-full text-gk-text-muted">
            Binary file not shown
          </div>
        ) : diffViewMode === 'unified' ? (
          <UnifiedDiffView diff={diff} />
        ) : (
          <SplitDiffView diff={diff} />
        )}
      </div>
    </div>
  );
}

function UnifiedDiffView({ diff }: { diff: GitDiff }) {
  return (
    <div className="font-mono text-sm">
      {diff.hunks.map((hunk, hunkIndex) => (
        <div key={hunkIndex} className="border-b border-gk-border">
          {/* Hunk header */}
          <div className="px-4 py-2 bg-gk-bg-tertiary/50 text-gk-accent-cyan text-xs">
            @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
          </div>

          {/* Hunk lines */}
          {hunk.lines.map((line, lineIndex) => (
            <DiffLine key={lineIndex} line={line} mode="unified" />
          ))}
        </div>
      ))}
    </div>
  );
}

function SplitDiffView({ diff }: { diff: GitDiff }) {
  return (
    <div className="flex h-full">
      {/* Old file */}
      <div className="flex-1 border-r border-gk-border overflow-auto">
        <div className="font-mono text-sm">
          {diff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex} className="border-b border-gk-border">
              <div className="px-4 py-2 bg-gk-bg-tertiary/50 text-gk-accent-orange text-xs">
                -{hunk.oldStart},{hunk.oldLines}
              </div>
              {hunk.lines
                .filter((line) => line.type !== 'add')
                .map((line, lineIndex) => (
                  <DiffLine key={lineIndex} line={line} mode="split-old" />
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* New file */}
      <div className="flex-1 overflow-auto">
        <div className="font-mono text-sm">
          {diff.hunks.map((hunk, hunkIndex) => (
            <div key={hunkIndex} className="border-b border-gk-border">
              <div className="px-4 py-2 bg-gk-bg-tertiary/50 text-gk-accent-green text-xs">
                +{hunk.newStart},{hunk.newLines}
              </div>
              {hunk.lines
                .filter((line) => line.type !== 'delete')
                .map((line, lineIndex) => (
                  <DiffLine key={lineIndex} line={line} mode="split-new" />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

