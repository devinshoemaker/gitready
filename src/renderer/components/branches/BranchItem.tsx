import React, { useState } from 'react';
import { useBranchesStore } from '../../stores/branches.store';
import { useUIStore } from '../../stores/ui.store';
import type { GitBranch } from '../../../shared/types/git.types';

interface BranchItemProps {
  branch: GitBranch;
}

export function BranchItem({ branch }: BranchItemProps) {
  const { checkout, deleteBranch, merge, rebase } = useBranchesStore();
  const { showNotification } = useUIStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const handleDoubleClick = async () => {
    if (branch.current || branch.isRemote) return;
    
    try {
      await checkout(branch.name);
      showNotification('success', `Switched to ${branch.name}`);
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleCheckout = async () => {
    setShowContextMenu(false);
    try {
      await checkout(branch.name);
      showNotification('success', `Switched to ${branch.name}`);
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handleMerge = async () => {
    setShowContextMenu(false);
    try {
      const result = await merge(branch.name);
      if (result.success) {
        showNotification('success', `Merged ${branch.name}`);
      } else if (result.conflicts.length > 0) {
        showNotification('error', `Merge conflicts in ${result.conflicts.length} files`);
      } else {
        showNotification('error', result.message || 'Merge failed');
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handleRebase = async () => {
    setShowContextMenu(false);
    try {
      const result = await rebase(branch.name);
      if (result.success) {
        showNotification('success', `Rebased onto ${branch.name}`);
      } else if (result.conflicts.length > 0) {
        showNotification('error', `Rebase conflicts in ${result.conflicts.length} files`);
      } else {
        showNotification('error', result.message || 'Rebase failed');
      }
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handleDelete = async () => {
    setShowContextMenu(false);
    if (!confirm(`Delete branch ${branch.name}?`)) return;
    
    try {
      await deleteBranch(branch.name);
      showNotification('success', `Deleted ${branch.name}`);
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  const displayName = branch.isRemote
    ? branch.name.replace(/^origin\//, '')
    : branch.name;

  return (
    <>
      <div
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className={`
          group flex items-center gap-2 px-4 py-1.5 cursor-pointer
          ${branch.current ? 'bg-gk-accent-cyan/10' : 'hover:bg-gk-bg-secondary/50'}
        `}
      >
        {/* Current indicator */}
        {branch.current ? (
          <svg className="w-4 h-4 text-gk-accent-cyan" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        )}

        {/* Branch name */}
        <span className={`text-sm truncate ${branch.current ? 'text-gk-accent-cyan font-medium' : 'text-gk-text'}`}>
          {displayName}
        </span>

        {/* Tracking info */}
        {branch.ahead !== undefined && branch.ahead > 0 && (
          <span className="text-xs text-gk-accent-cyan">↑{branch.ahead}</span>
        )}
        {branch.behind !== undefined && branch.behind > 0 && (
          <span className="text-xs text-gk-accent-orange">↓{branch.behind}</span>
        )}
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
        >
          {!branch.current && !branch.isRemote && (
            <button onClick={handleCheckout} className="context-menu-item w-full text-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Checkout
            </button>
          )}
          {!branch.current && (
            <button onClick={handleMerge} className="context-menu-item w-full text-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Merge into current
            </button>
          )}
          {!branch.current && (
            <button onClick={handleRebase} className="context-menu-item w-full text-left">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Rebase current onto
            </button>
          )}
          {!branch.current && !branch.isRemote && (
            <button onClick={handleDelete} className="context-menu-item w-full text-left text-gk-accent-magenta">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </>
  );
}

