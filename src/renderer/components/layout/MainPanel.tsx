import React from 'react';
import { useUIStore, ViewType } from '../../stores/ui.store';
import { useCommitsStore } from '../../stores/commits.store';
import { CommitGraph } from '../graph/CommitGraph';
import { StagingArea } from '../staging/StagingArea';
import { CommitDetails } from '../commits/CommitDetails';
import { CommitDiffViewer } from '../commits/CommitDiffViewer';
import { DiffViewer } from '../diff/DiffViewer';
import { BlameView } from '../blame/BlameView';
import { FileHistory } from '../history/FileHistory';
import { ConflictResolver } from '../conflicts/ConflictResolver';

export function MainPanel() {
  const { currentView, selectedFile } = useUIStore();
  const selectedCommit = useCommitsStore((state) => state.selectedCommit);
  const selectedCommitFile = useCommitsStore((state) => state.selectedCommitFile);
  const selectCommitFile = useCommitsStore((state) => state.selectCommitFile);

  const renderContent = () => {
    switch (currentView) {
      case 'graph':
        return (
          <div className="flex h-full">
            <div className="flex-1 overflow-hidden">
              {selectedCommit && selectedCommitFile ? (
                <CommitDiffViewer
                  commitHash={selectedCommit.hash}
                  filePath={selectedCommitFile}
                  onClose={() => selectCommitFile(null)}
                />
              ) : (
                <CommitGraph />
              )}
            </div>
            <div className="w-96 border-l border-gk-border">
              {selectedCommit ? <CommitDetails /> : <StagingArea />}
            </div>
          </div>
        );
      case 'staging':
        return <StagingArea fullWidth />;
      case 'diff':
        return <DiffViewer />;
      case 'blame':
        return <BlameView />;
      case 'history':
        return <FileHistory />;
      case 'conflicts':
        return <ConflictResolver />;
      default:
        return (
          <div className="flex-1 overflow-hidden">
            <CommitGraph />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* View tabs */}
      <div className="flex items-center gap-1 px-4 py-2 bg-gk-bg border-b border-gk-border">
        <ViewTab view="graph" label="Graph" icon="graph" />
        <ViewTab view="staging" label="Staging" icon="staging" />
        {selectedFile && (
          <>
            <ViewTab view="diff" label="Diff" icon="diff" />
            <ViewTab view="blame" label="Blame" icon="blame" />
            <ViewTab view="history" label="History" icon="history" />
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
}

interface ViewTabProps {
  view: ViewType;
  label: string;
  icon: string;
}

function ViewTab({ view, label, icon }: ViewTabProps) {
  const { currentView, setCurrentView } = useUIStore();
  const isActive = currentView === view;

  const icons: Record<string, React.ReactNode> = {
    graph: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    staging: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    diff: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
      </svg>
    ),
    blame: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    history: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <button
      onClick={() => setCurrentView(view)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        ${isActive 
          ? 'bg-gk-accent-cyan/20 text-gk-accent-cyan' 
          : 'text-gk-text-muted hover:text-gk-text hover:bg-gk-bg-secondary'
        }
      `}
    >
      {icons[icon]}
      {label}
    </button>
  );
}

