import React from 'react';
import { useUIStore } from '../../stores/ui.store';
import { useRepositoryStore } from '../../stores/repository.store';
import { FILE_STATUS_COLORS, FILE_STATUS_LABELS } from '../../../shared/constants';
import type { GitFileStatus } from '../../../shared/types/git.types';

interface FileListProps {
  files: GitFileStatus[];
  type: 'staged' | 'unstaged';
}

export function FileList({ files, type }: FileListProps) {
  const { selectFile, selectedFile, setCurrentView } = useUIStore();
  const refreshStatus = useRepositoryStore((state) => state.refreshStatus);

  const handleFileClick = (file: GitFileStatus) => {
    selectFile(file.path);
  };

  const handleFileDoubleClick = (file: GitFileStatus) => {
    selectFile(file.path);
    setCurrentView('diff');
  };

  const handleStageToggle = async (e: React.MouseEvent, file: GitFileStatus) => {
    e.stopPropagation();
    if (type === 'staged') {
      await window.electronAPI.git.unstage([file.path]);
    } else {
      await window.electronAPI.git.stage([file.path]);
    }
    await refreshStatus();
  };

  const handleDiscard = async (e: React.MouseEvent, file: GitFileStatus) => {
    e.stopPropagation();
    if (confirm(`Discard changes to ${file.path}?`)) {
      await window.electronAPI.git.discardChanges([file.path]);
      await refreshStatus();
    }
  };

  const getFileName = (path: string) => {
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  const getDirectory = (path: string) => {
    const parts = path.split('/');
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/') + '/';
  };

  const getStatusChar = (file: GitFileStatus) => {
    if (type === 'staged') {
      return file.index;
    }
    return file.workingDir === ' ' ? file.index : file.workingDir;
  };

  if (files.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gk-text-muted text-sm">
        {type === 'staged' ? 'No staged changes' : 'No unstaged changes'}
      </div>
    );
  }

  return (
    <div className="py-1">
      {files.map((file) => {
        const statusChar = getStatusChar(file);
        const statusColor = FILE_STATUS_COLORS[statusChar] || FILE_STATUS_COLORS[' '];
        const statusLabel = FILE_STATUS_LABELS[statusChar] || 'Unknown';
        const isSelected = selectedFile === file.path;

        return (
          <div
            key={file.path}
            onClick={() => handleFileClick(file)}
            onDoubleClick={() => handleFileDoubleClick(file)}
            className={`
              group flex items-center gap-2 px-4 py-1.5 cursor-pointer
              ${isSelected ? 'bg-gk-accent-cyan/10' : 'hover:bg-gk-bg-secondary/50'}
            `}
          >
            {/* Status badge */}
            <span
              className="status-badge text-xs font-bold"
              style={{ backgroundColor: `${statusColor}20`, color: statusColor }}
              title={statusLabel}
            >
              {statusChar}
            </span>

            {/* File path */}
            <div className="flex-1 min-w-0">
              <span className="text-gk-text-muted text-xs">{getDirectory(file.path)}</span>
              <span className="text-gk-text text-sm">{getFileName(file.path)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Stage/Unstage */}
              <button
                onClick={(e) => handleStageToggle(e, file)}
                className="p-1 rounded hover:bg-gk-bg-tertiary"
                title={type === 'staged' ? 'Unstage' : 'Stage'}
              >
                {type === 'staged' ? (
                  <svg className="w-4 h-4 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gk-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>

              {/* Discard (only for unstaged) */}
              {type === 'unstaged' && (
                <button
                  onClick={(e) => handleDiscard(e, file)}
                  className="p-1 rounded hover:bg-gk-bg-tertiary"
                  title="Discard changes"
                >
                  <svg className="w-4 h-4 text-gk-accent-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {/* View diff */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  selectFile(file.path);
                  setCurrentView('diff');
                }}
                className="p-1 rounded hover:bg-gk-bg-tertiary"
                title="View diff"
              >
                <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

