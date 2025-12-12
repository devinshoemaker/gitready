import { useState, useEffect, useCallback } from 'react';
import { useCommitsStore } from '../../stores/commits.store';
import type { GitCommitFile } from '../../../shared/types/git.types';

export function CommitDetails() {
  const { selectedCommit, selectCommit, selectedCommitFile, selectCommitFile } = useCommitsStore();
  const [files, setFiles] = useState<GitCommitFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  const fetchFiles = useCallback(async () => {
    if (!selectedCommit) return;
    
    setIsLoadingFiles(true);
    setFiles([]); // Reset files when fetching new commit
    try {
      const response = await window.electronAPI.git.getCommitFiles(selectedCommit.hash);
      if (response.success) {
        setFiles(response.data);
      }
    } catch (error) {
      console.error('Error fetching commit files:', error);
    }
    setIsLoadingFiles(false);
  }, [selectedCommit]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  if (!selectedCommit) {
    return null;
  }

  const handleClose = () => {
    selectCommit(null);
  };

  const handleFileClick = (filePath: string) => {
    selectCommitFile(filePath);
  };

  const getStatusBadge = (status: GitCommitFile['status']) => {
    switch (status) {
      case 'A':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-green/20 text-gk-accent-green">A</span>;
      case 'M':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-orange/20 text-gk-accent-orange">M</span>;
      case 'D':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-magenta/20 text-gk-accent-magenta">D</span>;
      case 'R':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-purple/20 text-gk-accent-purple">R</span>;
      case 'C':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gk-accent-cyan/20 text-gk-accent-cyan">C</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseRefs = (refs: string[]) => {
    return refs.map((ref) => {
      const isHead = ref.includes('HEAD');
      const isRemote = ref.includes('origin/');
      const isTag = ref.startsWith('tag:') || ref.includes('refs/tags/');
      
      const displayName = ref
        .replace('HEAD -> ', '')
        .replace('refs/heads/', '')
        .replace('refs/tags/', '')
        .replace('refs/remotes/', '')
        .replace('tag: ', '');

      return { displayName, isHead, isRemote, isTag, original: ref };
    });
  };

  const parsedRefs = parseRefs(selectedCommit.refs);

  return (
    <div className="h-full flex flex-col bg-gk-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gk-border bg-gk-bg-secondary">
        <h2 className="text-sm font-medium text-gk-text">Commit Details</h2>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-gk-bg-tertiary transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {/* Commit message */}
        <div>
          <h3 className="text-lg font-medium text-gk-text mb-2">
            {selectedCommit.message}
          </h3>
          {selectedCommit.body && (
            <p className="text-sm text-gk-text-muted whitespace-pre-wrap">
              {selectedCommit.body}
            </p>
          )}
        </div>

        {/* Refs (branches/tags) */}
        {parsedRefs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parsedRefs.map((ref) => {
              const bgColor = ref.isHead ? '#00d9ff' : ref.isTag ? '#fbbf24' : ref.isRemote ? '#a855f7' : '#00d9ff';
              return (
                <span
                  key={ref.original}
                  className="px-2 py-1 text-xs font-mono rounded"
                  style={{ backgroundColor: `${bgColor}20`, color: bgColor }}
                >
                  {ref.isTag && '🏷 '}
                  {ref.displayName}
                </span>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gk-border" />

        {/* Author info */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gk-bg-tertiary flex items-center justify-center text-gk-text font-medium">
              {selectedCommit.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gk-text">
                {selectedCommit.author.name}
              </div>
              <div className="text-xs text-gk-text-muted">
                {selectedCommit.author.email}
              </div>
              <div className="text-xs text-gk-text-muted mt-1">
                Authored on {formatDate(selectedCommit.author.date)}
              </div>
            </div>
          </div>

          {/* Show committer if different from author */}
          {selectedCommit.committer.name !== selectedCommit.author.name && (
            <div className="flex items-start gap-3 pl-4 border-l-2 border-gk-border">
              <div className="w-8 h-8 rounded-full bg-gk-bg-tertiary flex items-center justify-center text-gk-text text-sm font-medium">
                {selectedCommit.committer.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gk-text">
                  {selectedCommit.committer.name}
                </div>
                <div className="text-xs text-gk-text-muted">
                  Committed on {formatDate(selectedCommit.committer.date)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gk-border" />

        {/* Commit hash */}
        <div>
          <div className="text-xs text-gk-text-muted uppercase tracking-wider mb-1">
            Commit
          </div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-gk-accent-cyan truncate flex-1" title={selectedCommit.hash}>
              {selectedCommit.hash}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(selectedCommit.hash)}
              className="p-1 rounded hover:bg-gk-bg-tertiary transition-colors flex-shrink-0"
              title="Copy hash"
            >
              <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Parent commits */}
        {selectedCommit.parents.length > 0 && (
          <div>
            <div className="text-xs text-gk-text-muted uppercase tracking-wider mb-1">
              {selectedCommit.parents.length === 1 ? 'Parent' : 'Parents'}
            </div>
            <div className="space-y-1">
              {selectedCommit.parents.map((parent) => (
                <div key={parent} className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gk-text-muted">
                    {parent.substring(0, 7)}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(parent)}
                    className="p-1 rounded hover:bg-gk-bg-tertiary transition-colors"
                    title="Copy hash"
                  >
                    <svg className="w-3 h-3 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Merge commit indicator */}
        {selectedCommit.parents.length > 1 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="text-sm text-purple-400">This is a merge commit</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gk-border" />

        {/* Changed Files */}
        <div>
          <div className="text-xs text-gk-text-muted uppercase tracking-wider mb-2">
            Changed Files {files.length > 0 && `(${files.length})`}
          </div>
          {isLoadingFiles ? (
            <div className="flex items-center justify-center py-4">
              <div className="spinner" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-sm text-gk-text-muted py-2">No files changed</div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => handleFileClick(file.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-gk-bg-tertiary transition-colors ${
                    selectedCommitFile === file.path ? 'bg-gk-bg-tertiary' : ''
                  }`}
                >
                  {getStatusBadge(file.status)}
                  <span className="text-sm font-mono text-gk-text truncate flex-1" title={file.path}>
                    {file.path}
                  </span>
                  {file.oldPath && (
                    <span className="text-xs text-gk-text-muted truncate" title={`from ${file.oldPath}`}>
                      ← {file.oldPath}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
