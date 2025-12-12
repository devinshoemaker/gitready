import { useState, useEffect, useRef } from 'react';
import { useBranchesStore } from '../../stores/branches.store';
import { useRepositoryStore } from '../../stores/repository.store';
import { useUIStore } from '../../stores/ui.store';

export function CreateBranchModal() {
  const { createBranch, fetchBranches } = useBranchesStore();
  const repository = useRepositoryStore((state) => state.repository);
  const { toggleCreateBranch, showNotification } = useUIStore();
  
  const [branchName, setBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleCreateBranch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleCreateBranch]);

  const validateBranchName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Branch name is required';
    }
    if (name.includes(' ')) {
      return 'Branch name cannot contain spaces';
    }
    if (name.startsWith('-') || name.startsWith('.')) {
      return 'Branch name cannot start with - or .';
    }
    if (name.includes('..')) {
      return 'Branch name cannot contain ..';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateBranchName(branchName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await createBranch(branchName);
      await fetchBranches();
      showNotification('success', `Created and switched to branch "${branchName}"`);
      toggleCreateBranch();
    } catch (err) {
      const errorMessage = (err as Error).message || 'Failed to create branch';
      setError(errorMessage);
      showNotification('error', errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    toggleCreateBranch();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-gk-bg-secondary rounded-lg shadow-xl w-full max-w-md mx-4 border border-gk-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gk-border">
          <h2 className="text-lg font-medium text-gk-text">Create New Branch</h2>
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Branch name input */}
          <div>
            <label htmlFor="branch-name" className="block text-sm font-medium text-gk-text mb-1">
              Branch Name
            </label>
            <input
              ref={inputRef}
              id="branch-name"
              type="text"
              value={branchName}
              onChange={(e) => {
                setBranchName(e.target.value);
                setError(null);
              }}
              placeholder="feature/my-new-feature"
              className="w-full px-3 py-2 bg-gk-bg border border-gk-border rounded-lg text-gk-text placeholder-gk-text-muted focus:outline-none focus:border-gk-accent-cyan focus:ring-1 focus:ring-gk-accent-cyan"
              disabled={isCreating}
            />
            {error && (
              <p className="mt-1 text-sm text-gk-accent-magenta">{error}</p>
            )}
          </div>

          {/* Starting point info */}
          {repository?.currentBranch && (
            <div className="text-sm text-gk-text-muted">
              <span>Starting from: </span>
              <span className="font-mono text-gk-accent-cyan">{repository.currentBranch}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gk-text-muted hover:text-gk-text transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !branchName.trim()}
              className="px-4 py-2 text-sm font-medium bg-gk-accent-cyan text-gk-bg rounded-lg hover:bg-gk-accent-cyan/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gk-bg border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Branch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
