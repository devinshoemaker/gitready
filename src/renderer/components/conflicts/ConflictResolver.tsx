import { useState, useEffect } from 'react';
import { useRepositoryStore } from '../../stores/repository.store';
import { useUIStore } from '../../stores/ui.store';

export function ConflictResolver() {
  const status = useRepositoryStore((state) => state.status);
  const refreshStatus = useRepositoryStore((state) => state.refreshStatus);
  const { selectedFile, selectFile, showNotification } = useUIStore();
  
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const conflictedFiles = status?.conflicted || [];
  const currentFile = selectedFile || conflictedFiles[0]?.path;

  useEffect(() => {
    if (!currentFile) return;

    const loadFile = async () => {
      setIsLoading(true);
      try {
        const response = await window.electronAPI.file.readFile(currentFile);
        if (response.success) {
          setFileContent(response.data);
        }
      } catch (error) {
        console.error('Error loading file:', error);
      }
      setIsLoading(false);
    };

    loadFile();
  }, [currentFile]);

  const handleResolve = async (resolution: 'ours' | 'theirs' | 'manual') => {
    if (!currentFile) return;

    setIsResolving(true);
    try {
      const content = resolution === 'manual' ? fileContent : undefined;
      const response = await window.electronAPI.git.resolveConflict(currentFile, resolution, content);
      
      if (response.success) {
        showNotification('success', `Resolved ${currentFile}`);
        await refreshStatus();
        
        // Select next conflicted file
        const remaining = conflictedFiles.filter((f) => f.path !== currentFile);
        if (remaining.length > 0) {
          selectFile(remaining[0].path);
        } else {
          selectFile(null);
        }
      } else {
        showNotification('error', response.error);
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
    setIsResolving(false);
  };

  if (conflictedFiles.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gk-text">No Conflicts</p>
          <p className="text-sm mt-2">All merge conflicts have been resolved</p>
        </div>
      </div>
    );
  }

  // Parse conflict markers
  const parseConflicts = (content: string) => {
    const sections: { type: 'ours' | 'theirs' | 'base' | 'normal'; content: string }[] = [];
    const lines = content.split('\n');
    let currentSection: { type: 'ours' | 'theirs' | 'base' | 'normal'; content: string } = {
      type: 'normal',
      content: '',
    };

    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        if (currentSection.content) {
          sections.push(currentSection);
        }
        currentSection = { type: 'ours', content: '' };
      } else if (line.startsWith('|||||||')) {
        sections.push(currentSection);
        currentSection = { type: 'base', content: '' };
      } else if (line.startsWith('=======')) {
        sections.push(currentSection);
        currentSection = { type: 'theirs', content: '' };
      } else if (line.startsWith('>>>>>>>')) {
        sections.push(currentSection);
        currentSection = { type: 'normal', content: '' };
      } else {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }

    if (currentSection.content) {
      sections.push(currentSection);
    }

    return sections;
  };

  const sections = parseConflicts(fileContent);
  const hasConflictMarkers = sections.some((s) => s.type !== 'normal');

  return (
    <div className="h-full flex">
      {/* File list */}
      <div className="w-64 bg-gk-bg-secondary border-r border-gk-border flex flex-col">
        <div className="px-4 py-3 border-b border-gk-border">
          <h3 className="text-sm font-medium text-gk-text">Conflicted Files</h3>
          <p className="text-xs text-gk-text-muted mt-1">
            {conflictedFiles.length} files with conflicts
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conflictedFiles.map((file) => (
            <button
              key={file.path}
              onClick={() => selectFile(file.path)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-left ${
                currentFile === file.path
                  ? 'bg-gk-accent-orange/20 text-gk-accent-orange'
                  : 'text-gk-text hover:bg-gk-bg-tertiary'
              }`}
            >
              <svg className="w-4 h-4 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm truncate">{file.path}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gk-bg-secondary border-b border-gk-border">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-mono text-sm text-gk-text">{currentFile}</span>
          </div>

          {/* Resolution buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResolve('ours')}
              disabled={isResolving}
              className="btn btn-secondary text-sm"
            >
              Accept Ours
            </button>
            <button
              onClick={() => handleResolve('theirs')}
              disabled={isResolving}
              className="btn btn-secondary text-sm"
            >
              Accept Theirs
            </button>
            <button
              onClick={() => handleResolve('manual')}
              disabled={isResolving || hasConflictMarkers}
              className="btn btn-primary text-sm"
            >
              {isResolving ? (
                <span className="flex items-center gap-2">
                  <div className="spinner w-4 h-4" />
                  Resolving...
                </span>
              ) : (
                'Mark Resolved'
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="spinner" />
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={`rounded-lg border ${
                    section.type === 'ours'
                      ? 'border-gk-accent-cyan bg-gk-accent-cyan/10'
                      : section.type === 'theirs'
                      ? 'border-gk-accent-magenta bg-gk-accent-magenta/10'
                      : section.type === 'base'
                      ? 'border-gk-accent-yellow bg-gk-accent-yellow/10'
                      : 'border-gk-border'
                  }`}
                >
                  {section.type !== 'normal' && (
                    <div className="px-3 py-1 border-b border-inherit text-xs font-medium uppercase">
                      {section.type === 'ours' && <span className="text-gk-accent-cyan">Current Changes (Ours)</span>}
                      {section.type === 'theirs' && <span className="text-gk-accent-magenta">Incoming Changes (Theirs)</span>}
                      {section.type === 'base' && <span className="text-gk-accent-yellow">Base</span>}
                    </div>
                  )}
                  <pre className="p-3 font-mono text-sm whitespace-pre-wrap text-gk-text">
                    {section.content}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

