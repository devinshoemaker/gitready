import { useBranchesStore } from '../../stores/branches.store';
import { useUIStore } from '../../stores/ui.store';

export function StashList() {
  const { stashes, stashApply, stashPop, stashDrop } = useBranchesStore();
  const { showNotification } = useUIStore();

  const handleApply = async (index: number) => {
    try {
      await stashApply(index);
      showNotification('success', 'Stash applied');
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handlePop = async (index: number) => {
    try {
      await stashPop(index);
      showNotification('success', 'Stash popped');
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  const handleDrop = async (index: number) => {
    if (!confirm('Drop this stash? This cannot be undone.')) return;
    
    try {
      await stashDrop(index);
      showNotification('success', 'Stash dropped');
    } catch (error) {
      showNotification('error', (error as Error).message);
    }
  };

  if (stashes.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gk-text-muted">
        No stashes
      </div>
    );
  }

  return (
    <div className="py-1">
      {stashes.map((stash) => (
        <div
          key={stash.index}
          className="group flex items-center gap-2 px-4 py-1.5 hover:bg-gk-bg-secondary/50"
        >
          {/* Stash icon */}
          <svg className="w-4 h-4 text-gk-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>

          {/* Stash info */}
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gk-text truncate">
              {stash.message || `stash@{${stash.index}}`}
            </div>
            <div className="text-xs text-gk-text-muted">
              {stash.hash.substring(0, 7)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleApply(stash.index)}
              className="p-1 rounded hover:bg-gk-bg-tertiary"
              title="Apply"
            >
              <svg className="w-4 h-4 text-gk-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button
              onClick={() => handlePop(stash.index)}
              className="p-1 rounded hover:bg-gk-bg-tertiary"
              title="Pop"
            >
              <svg className="w-4 h-4 text-gk-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
            <button
              onClick={() => handleDrop(stash.index)}
              className="p-1 rounded hover:bg-gk-bg-tertiary"
              title="Drop"
            >
              <svg className="w-4 h-4 text-gk-accent-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

