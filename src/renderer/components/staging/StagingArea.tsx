import React from 'react';
import { useRepositoryStore } from '../../stores/repository.store';
import { useUIStore } from '../../stores/ui.store';
import { FileList } from './FileList';
import { CommitForm } from './CommitForm';

interface StagingAreaProps {
  fullWidth?: boolean;
}

export function StagingArea({ fullWidth = false }: StagingAreaProps) {
  const status = useRepositoryStore((state) => state.status);
  const refreshStatus = useRepositoryStore((state) => state.refreshStatus);
  const { isCommitPanelOpen, toggleCommitPanel } = useUIStore();

  if (!status) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-gk-bg ${fullWidth ? '' : 'max-w-md'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gk-border">
        <h2 className="text-sm font-medium text-gk-text">Changes</h2>
        <div className="flex items-center gap-2">
          {!status.isClean && (
            <span className="px-2 py-0.5 text-xs rounded bg-gk-accent-cyan/20 text-gk-accent-cyan">
              {status.staged.length + status.unstaged.length} files
            </span>
          )}
        </div>
      </div>

      {/* File lists */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Staged files */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="px-4 py-2 flex items-center justify-between bg-gk-bg-secondary/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gk-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gk-text">Staged Changes</span>
              <span className="text-xs text-gk-text-muted">({status.staged.length})</span>
            </div>
            {status.staged.length > 0 && (
              <button
                onClick={async () => {
                  const files = status.staged.map((f) => f.path);
                  await window.electronAPI.git.unstage(files);
                  await refreshStatus();
                }}
                className="text-xs text-gk-text-muted hover:text-gk-text"
              >
                Unstage All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileList files={status.staged} type="staged" />
          </div>
        </div>

        {/* Unstaged files */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t border-gk-border">
          <div className="px-4 py-2 flex items-center justify-between bg-gk-bg-secondary/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm text-gk-text">Unstaged Changes</span>
              <span className="text-xs text-gk-text-muted">({status.unstaged.length})</span>
            </div>
            {status.unstaged.length > 0 && (
              <button
                onClick={async () => {
                  const files = status.unstaged.map((f) => f.path);
                  await window.electronAPI.git.stage(files);
                  await refreshStatus();
                }}
                className="text-xs text-gk-text-muted hover:text-gk-text"
              >
                Stage All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <FileList files={status.unstaged} type="unstaged" />
          </div>
        </div>
      </div>

      {/* Commit form */}
      <div className="border-t border-gk-border">
        <button
          onClick={toggleCommitPanel}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-gk-bg-secondary/50"
        >
          <span className="text-sm font-medium text-gk-text">Commit</span>
          <svg
            className={`w-4 h-4 text-gk-text-muted transition-transform ${isCommitPanelOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        {isCommitPanelOpen && <CommitForm />}
      </div>
    </div>
  );
}

