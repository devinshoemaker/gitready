import { useEffect, useState } from 'react';
import { useUIStore } from '../../stores/ui.store';
import type { GitBlame, GitBlameLine } from '../../../shared/types/git.types';

export function BlameView() {
  const { selectedFile } = useUIStore();
  const [blame, setBlame] = useState<GitBlame | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCommit, setHoveredCommit] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) return;

    const loadBlame = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await window.electronAPI.git.blame(selectedFile);
        if (response.success) {
          setBlame(response.data);
        } else {
          setError(response.error);
        }
      } catch (err) {
        setError((err as Error).message);
      }
      setIsLoading(false);
    };

    loadBlame();
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p>Select a file to view blame</p>
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
          <p>Error loading blame</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!blame || blame.lines.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <p>No blame information available</p>
      </div>
    );
  }

  // Group consecutive lines by commit
  const groupedLines: { commit: GitBlameLine['commit']; lines: GitBlameLine[] }[] = [];
  blame.lines.forEach((line) => {
    const lastGroup = groupedLines[groupedLines.length - 1];
    if (lastGroup && lastGroup.commit.hash === line.commit.hash) {
      lastGroup.lines.push(line);
    } else {
      groupedLines.push({ commit: line.commit, lines: [line] });
    }
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gk-bg-secondary border-b border-gk-border">
        <svg className="w-5 h-5 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="font-mono text-sm text-gk-text">{selectedFile}</span>
        <span className="text-xs text-gk-text-muted">
          {blame.lines.length} lines
        </span>
      </div>

      {/* Blame content */}
      <div className="flex-1 overflow-auto font-mono text-sm">
        {blame.lines.map((line, index) => {
          const isHovered = hoveredCommit === line.commit.hash;
          const showCommitInfo = index === 0 || blame.lines[index - 1].commit.hash !== line.commit.hash;

          return (
            <div
              key={index}
              className={`flex ${isHovered ? 'bg-gk-accent-cyan/10' : ''}`}
              onMouseEnter={() => setHoveredCommit(line.commit.hash)}
              onMouseLeave={() => setHoveredCommit(null)}
            >
              {/* Blame info */}
              <div
                className={`w-80 flex-shrink-0 flex items-start gap-2 px-3 py-0.5 border-r border-gk-border cursor-pointer hover:bg-gk-bg-secondary/50 ${
                  showCommitInfo ? 'border-t border-gk-border/30' : ''
                }`}
                onClick={() => {
                  // TODO: Navigate to commit
                }}
              >
                {showCommitInfo ? (
                  <>
                    <span className="text-gk-accent-cyan">{line.commit.hashShort}</span>
                    <span className="flex-1 truncate text-gk-text-muted">{line.commit.author}</span>
                    <span className="text-gk-text-muted/50 text-xs">{formatDate(line.commit.date)}</span>
                  </>
                ) : (
                  <span className="text-transparent">&nbsp;</span>
                )}
              </div>

              {/* Line number */}
              <span className="w-12 px-2 text-right text-gk-text-muted/50 select-none">
                {line.lineNumber}
              </span>

              {/* Content */}
              <span className="flex-1 px-2 whitespace-pre overflow-x-auto text-gk-text">
                {line.content}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

