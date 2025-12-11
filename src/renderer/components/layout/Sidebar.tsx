import { useState } from 'react';
import { useBranchesStore } from '../../stores/branches.store';
import { useUIStore } from '../../stores/ui.store';
import { BranchList } from '../branches/BranchList';
import { StashList } from '../stash/StashList';

type SidebarSection = 'local' | 'remote' | 'stashes' | 'tags';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, toggleCreateBranch } = useUIStore();
  const branches = useBranchesStore((state) => state.branches);
  const stashes = useBranchesStore((state) => state.stashes);

  const [expandedSections, setExpandedSections] = useState<Set<SidebarSection>>(
    new Set(['local', 'remote'])
  );

  const toggleSection = (section: SidebarSection) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  if (sidebarCollapsed) {
    return (
      <div className="w-12 bg-gk-bg-secondary border-r border-gk-border flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-text transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gk-bg-secondary border-r border-gk-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gk-border">
        <span className="text-sm font-medium text-gk-text-muted uppercase tracking-wider">
          Branches
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleCreateBranch}
            className="p-1 rounded hover:bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-accent-cyan transition-colors"
            title="Create branch"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded hover:bg-gk-bg-tertiary text-gk-text-muted hover:text-gk-text transition-colors"
            title="Collapse sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Local branches */}
        <div className="py-1">
          <button
            onClick={() => toggleSection('local')}
            className="collapsible-header w-full"
          >
            <svg
              className={`collapsible-arrow ${expandedSections.has('local') ? 'open' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-4 h-4 text-gk-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
            </svg>
            <span className="text-sm text-gk-text">Local</span>
            <span className="ml-auto text-xs text-gk-text-muted">{localBranches.length}</span>
          </button>
          {expandedSections.has('local') && <BranchList branches={localBranches} />}
        </div>

        {/* Remote branches */}
        <div className="py-1">
          <button
            onClick={() => toggleSection('remote')}
            className="collapsible-header w-full"
          >
            <svg
              className={`collapsible-arrow ${expandedSections.has('remote') ? 'open' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-4 h-4 text-gk-accent-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-sm text-gk-text">Remote</span>
            <span className="ml-auto text-xs text-gk-text-muted">{remoteBranches.length}</span>
          </button>
          {expandedSections.has('remote') && <BranchList branches={remoteBranches} />}
        </div>

        {/* Stashes */}
        <div className="py-1">
          <button
            onClick={() => toggleSection('stashes')}
            className="collapsible-header w-full"
          >
            <svg
              className={`collapsible-arrow ${expandedSections.has('stashes') ? 'open' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <svg className="w-4 h-4 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <span className="text-sm text-gk-text">Stashes</span>
            <span className="ml-auto text-xs text-gk-text-muted">{stashes.length}</span>
          </button>
          {expandedSections.has('stashes') && <StashList />}
        </div>
      </div>
    </div>
  );
}

