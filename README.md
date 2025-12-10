# GitKraken Clone

A full-featured Git GUI application built with Electron, React, and TypeScript.

## Features

- **Commit Graph Visualization** - Interactive SVG-based commit graph with branch lines
- **Staging Area** - Stage/unstage files with visual status indicators
- **Branch Management** - Create, checkout, merge, and delete branches
- **Diff Viewer** - Side-by-side and unified diff views with syntax highlighting
- **Remote Operations** - Push, pull, and fetch with progress indicators
- **Stash Management** - Create, apply, and manage stashes
- **Conflict Resolution** - Visual merge conflict resolver
- **Blame View** - Line-by-line commit attribution
- **File History** - View all commits affecting a file
- **Search** - Search commits by message, author, or hash

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **simple-git** - Git operations
- **Vitest** - Testing framework

## Getting Started

### Prerequisites

- Node.js 18+
- Git installed on your system

### Installation

```bash
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Run tests
npm test

# Build for production
npm run electron:build
```

## Development

### Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React application
└── shared/         # Shared types and utilities
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## License

MIT

