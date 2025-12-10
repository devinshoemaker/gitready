// Branch colors for the commit graph
export const BRANCH_COLORS = [
  '#00d9ff', // cyan
  '#ff006e', // magenta
  '#00ff88', // green
  '#ff8c00', // orange
  '#a855f7', // purple
  '#fbbf24', // yellow
  '#06b6d4', // teal
  '#f43f5e', // rose
  '#84cc16', // lime
  '#8b5cf6', // violet
] as const;

// File status indicators
export const FILE_STATUS_LABELS: Record<string, string> = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  U: 'Unmerged',
  '?': 'Untracked',
  '!': 'Ignored',
  ' ': 'Unmodified',
};

export const FILE_STATUS_COLORS: Record<string, string> = {
  M: '#fbbf24', // yellow
  A: '#00ff88', // green
  D: '#ff006e', // magenta
  R: '#a855f7', // purple
  C: '#00d9ff', // cyan
  U: '#ff8c00', // orange (conflict)
  '?': '#71717a', // gray
  '!': '#3f3f46', // dark gray
  ' ': '#e4e4e7', // white
};

// Commit graph settings
export const GRAPH_CONFIG = {
  NODE_RADIUS: 5,
  NODE_SPACING_X: 24,  // Horizontal space between branch columns
  NODE_SPACING_Y: 40,
  LINE_WIDTH: 2,
  COMMIT_HEIGHT: 48,   // Vertical space between commits
  SIDEBAR_WIDTH: 40,   // Left margin for the graph
} as const;

// Application settings
export const APP_CONFIG = {
  MAX_COMMITS_PER_LOAD: 100,
  DEBOUNCE_FILE_WATCH: 500,
  SEARCH_DEBOUNCE: 300,
  MAX_DIFF_LINES: 5000,
} as const;

