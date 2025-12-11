import { useEffect } from 'react';
import { useRepositoryStore } from './stores/repository.store';
import { useCommitsStore } from './stores/commits.store';
import { useBranchesStore } from './stores/branches.store';
import { useUIStore } from './stores/ui.store';
import { Sidebar } from './components/layout/Sidebar';
import { Toolbar } from './components/layout/Toolbar';
import { MainPanel } from './components/layout/MainPanel';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Notification } from './components/Notification';
import { SearchPanel } from './components/search/SearchPanel';

function App() {
  const repository = useRepositoryStore((state) => state.repository);
  const refreshStatus = useRepositoryStore((state) => state.refreshStatus);
  const fetchCommits = useCommitsStore((state) => state.fetchCommits);
  const fetchBranches = useBranchesStore((state) => state.fetchBranches);
  const fetchStashes = useBranchesStore((state) => state.fetchStashes);
  const isSearchOpen = useUIStore((state) => state.isSearchOpen);
  const notification = useUIStore((state) => state.notification);

  // Set up repository change listener
  useEffect(() => {
    if (!repository) return;

    const unsubscribe = window.electronAPI.onRepoChange(() => {
      refreshStatus();
      fetchCommits();
      fetchBranches();
    });

    return () => {
      unsubscribe();
    };
  }, [repository, refreshStatus, fetchCommits, fetchBranches]);

  // Initial data fetch when repository opens
  useEffect(() => {
    if (repository) {
      fetchCommits();
      fetchBranches();
      fetchStashes();
    }
  }, [repository, fetchCommits, fetchBranches, fetchStashes]);

  // Refresh git status when window gains focus
  useEffect(() => {
    if (!repository) return;

    const handleFocus = () => {
      refreshStatus();
      fetchCommits();
      fetchBranches();
      fetchStashes();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [repository, refreshStatus, fetchCommits, fetchBranches, fetchStashes]);

  if (!repository) {
    return <WelcomeScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-gk-bg overflow-hidden">
      {/* Toolbar */}
      <Toolbar />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main panel */}
        <MainPanel />
      </div>

      {/* Search overlay */}
      {isSearchOpen && <SearchPanel />}

      {/* Notification */}
      {notification && <Notification />}
    </div>
  );
}

export default App;

