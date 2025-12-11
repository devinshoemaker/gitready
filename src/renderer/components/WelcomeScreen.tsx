import { useRepositoryStore } from '../stores/repository.store';

export function WelcomeScreen() {
  const { openRepository, isLoading, error } = useRepositoryStore();

  const handleOpenRepository = async () => {
    const path = await window.electronAPI.dialog.openDirectory();
    if (path) {
      await openRepository(path);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gk-bg">
      {/* Logo and title */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-gk-accent-cyan to-gk-accent-magenta p-1">
          <div className="w-full h-full rounded-xl bg-gk-bg flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gk-accent-cyan"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gk-text mb-2">GitKraken Clone</h1>
        <p className="text-gk-text-muted">A powerful Git GUI for developers</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-4 w-80">
        <button
          onClick={handleOpenRepository}
          disabled={isLoading}
          className="btn btn-primary py-4 text-lg flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                />
              </svg>
              Open Repository
            </>
          )}
        </button>

        <button className="btn btn-secondary py-4 text-lg flex items-center justify-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          Clone Repository
        </button>

        <button className="btn btn-secondary py-4 text-lg flex items-center justify-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Initialize Repository
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-6 px-4 py-3 rounded-lg bg-red-900/50 border border-red-500 text-red-300">
          {error}
        </div>
      )}

      {/* Recent repositories */}
      <div className="mt-12 text-center">
        <h3 className="text-sm font-medium text-gk-text-muted uppercase tracking-wider mb-4">
          Recent Repositories
        </h3>
        <p className="text-gk-text-muted text-sm">No recent repositories</p>
      </div>
    </div>
  );
}

