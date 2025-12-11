import { useState, useEffect, useRef, useCallback } from 'react';
import { useCommitsStore } from '../../stores/commits.store';
import { useUIStore } from '../../stores/ui.store';
import { APP_CONFIG } from '../../../shared/constants';
import type { GitCommit } from '../../../shared/types/git.types';

type SearchType = 'message' | 'author' | 'hash' | 'all';

export function SearchPanel() {
  const { searchCommits, commits, isLoading, selectCommit } = useCommitsStore();
  const { toggleSearch, setCurrentView } = useUIStore();
  
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [results, setResults] = useState<GitCommit[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleSelectCommit = useCallback((commit: GitCommit) => {
    selectCommit(commit);
    setCurrentView('graph');
    toggleSearch();
  }, [selectCommit, setCurrentView, toggleSearch]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelectCommit(results[selectedIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, toggleSearch, handleSelectCommit]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      await searchCommits(query, searchType);
    }, APP_CONFIG.SEARCH_DEBOUNCE);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchType, searchCommits]);

  // Update results when commits change
  useEffect(() => {
    if (query.trim()) {
      setResults(commits);
      setSelectedIndex(0);
    }
  }, [commits, query]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleSearch}
      />

      {/* Search panel */}
      <div className="relative w-full max-w-2xl mx-4 bg-gk-bg-secondary rounded-xl shadow-2xl border border-gk-border animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gk-border">
          <svg className="w-5 h-5 text-gk-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commits..."
            className="flex-1 bg-transparent text-gk-text placeholder-gk-text-muted outline-none"
          />
          {isLoading && <div className="spinner w-5 h-5" />}
          <button
            onClick={toggleSearch}
            className="p-1 text-gk-text-muted hover:text-gk-text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search type tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gk-border">
          {(['all', 'message', 'author', 'hash'] as SearchType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSearchType(type)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                searchType === type
                  ? 'bg-gk-accent-cyan/20 text-gk-accent-cyan'
                  : 'text-gk-text-muted hover:text-gk-text'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query.trim() && !isLoading ? (
            <div className="px-4 py-8 text-center text-gk-text-muted">
              No commits found
            </div>
          ) : (
            results.map((commit, index) => (
              <button
                key={commit.hash}
                onClick={() => handleSelectCommit(commit)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left ${
                  index === selectedIndex
                    ? 'bg-gk-accent-cyan/10'
                    : 'hover:bg-gk-bg-tertiary/50'
                }`}
              >
                {/* Commit hash */}
                <span className="font-mono text-sm text-gk-accent-cyan flex-shrink-0">
                  {commit.hashShort}
                </span>

                {/* Commit info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gk-text truncate">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gk-text-muted">
                    <span>{commit.author.name}</span>
                    <span>•</span>
                    <span>{formatDate(commit.author.date)}</span>
                  </div>
                </div>

                {/* Refs */}
                {commit.refs.length > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {commit.refs.slice(0, 2).map((ref) => (
                      <span
                        key={ref}
                        className="px-2 py-0.5 text-xs rounded bg-gk-accent-purple/20 text-gk-accent-purple"
                      >
                        {ref.replace('refs/heads/', '').replace('refs/tags/', '')}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gk-border text-xs text-gk-text-muted">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gk-bg-tertiary">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-gk-bg-tertiary ml-1">↓</kbd>
              to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gk-bg-tertiary">Enter</kbd>
              to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gk-bg-tertiary">Esc</kbd>
              to close
            </span>
          </div>
          {results.length > 0 && (
            <span>{results.length} results</span>
          )}
        </div>
      </div>
    </div>
  );
}

