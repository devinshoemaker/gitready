import { useRef, useMemo } from 'react';
import { useCommitsStore } from '../../stores/commits.store';
import { useBranchesStore } from '../../stores/branches.store';
import { BRANCH_COLORS, GRAPH_CONFIG } from '../../../shared/constants';
import { CommitNode } from './CommitNode';
import { BranchLine } from './BranchLine';
import type { GitCommit } from '../../../shared/types/git.types';

interface GraphNode {
  commit: GitCommit;
  x: number;
  y: number;
  color: string;
  column: number;
  branchName?: string;
}

interface BranchLegend {
  name: string;
  color: string;
}

export function CommitGraph() {
  const { commits, selectedCommit, selectCommit, isLoading, loadMoreCommits, hasMore } = useCommitsStore();
  const branches = useBranchesStore((state) => state.branches);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate graph layout using a lane-based approach
  const { graphNodes, branchLegend, maxColumn } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const legend: BranchLegend[] = [];
    
    if (commits.length === 0) {
      return { graphNodes: nodes, branchLegend: legend, maxColumn: 0 };
    }

    // Build commit index for quick lookup
    const commitIndex = new Map<string, number>();
    commits.forEach((c, i) => commitIndex.set(c.hash, i));

    // Track column assignment per commit
    const commitToColumn = new Map<string, number>();
    
    // Track which columns are "active" (have a line running through them) at each row
    // A column becomes inactive when its commit is a parent of the current commit
    const activeColumnsAtRow: Set<number>[] = [];
    
    // Track branch names we've seen for the legend
    const seenBranches = new Set<string>();

    let maxCol = 0;

    commits.forEach((commit, rowIndex) => {
      // Initialize active columns for this row based on previous row
      const prevActive = rowIndex > 0 ? new Set(activeColumnsAtRow[rowIndex - 1]) : new Set<number>();
      
      // Find columns used by children of this commit (commits that have this as a parent)
      const childColumns: number[] = [];
      for (let i = 0; i < rowIndex; i++) {
        const child = commits[i];
        if (child.parents.includes(commit.hash)) {
          const childCol = commitToColumn.get(child.hash);
          if (childCol !== undefined) {
            childColumns.push(childCol);
          }
        }
      }

      let column: number;
      
      if (childColumns.length > 0) {
        // This commit has children in view - use the first child's column (first parent relationship)
        column = Math.min(...childColumns);
        
        // Remove other child columns from active set (they merge here)
        childColumns.forEach(c => {
          if (c !== column) {
            prevActive.delete(c);
          }
        });
      } else {
        // This is a branch head (no children) - find a new column
        // Use the first available column
        column = 0;
        while (prevActive.has(column)) {
          column++;
        }
      }

      commitToColumn.set(commit.hash, column);
      prevActive.add(column);
      
      // Check if this commit has any refs (branch/tag names)
      let branchName: string | undefined;
      if (commit.refs.length > 0) {
        const ref = commit.refs[0]
          .replace('HEAD -> ', '')
          .replace('tag: ', '');
        branchName = ref;
        if (!seenBranches.has(ref)) {
          seenBranches.add(ref);
          legend.push({
            name: ref,
            color: BRANCH_COLORS[column % BRANCH_COLORS.length],
          });
        }
      }

      maxCol = Math.max(maxCol, column);

      // For merge commits with multiple parents, we need to ensure parent columns are set
      if (commit.parents.length > 1) {
        commit.parents.slice(1).forEach((parentHash) => {
          const parentIdx = commitIndex.get(parentHash);
          if (parentIdx !== undefined && !commitToColumn.has(parentHash)) {
            // Find a column for this parent branch
            let parentCol = column + 1;
            while (prevActive.has(parentCol)) {
              parentCol++;
            }
            commitToColumn.set(parentHash, parentCol);
            prevActive.add(parentCol);
            maxCol = Math.max(maxCol, parentCol);
          }
        });
      }

      activeColumnsAtRow[rowIndex] = prevActive;

      const color = BRANCH_COLORS[column % BRANCH_COLORS.length];

      nodes.push({
        commit,
        x: GRAPH_CONFIG.SIDEBAR_WIDTH + column * GRAPH_CONFIG.NODE_SPACING_X + 20,
        y: rowIndex * GRAPH_CONFIG.COMMIT_HEIGHT + 25,
        color,
        column,
        branchName,
      });
    });

    // Add current branch to legend if not already there
    const currentBranch = branches.find(b => b.current);
    if (currentBranch && !seenBranches.has(currentBranch.name)) {
      legend.unshift({
        name: currentBranch.name,
        color: BRANCH_COLORS[0],
      });
    }

    return { 
      graphNodes: nodes, 
      branchLegend: legend.slice(0, 8),
      maxColumn: maxCol,
    };
  }, [commits, branches]);

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 200;
    
    if (nearBottom && hasMore && !isLoading) {
      loadMoreCommits();
    }
  };

  if (commits.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gk-text-muted">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gk-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p>No commits yet</p>
        </div>
      </div>
    );
  }

  const graphHeight = Math.max(commits.length * GRAPH_CONFIG.COMMIT_HEIGHT + 50, 400);
  const graphWidth = Math.max(
    GRAPH_CONFIG.SIDEBAR_WIDTH + (maxColumn + 1) * GRAPH_CONFIG.NODE_SPACING_X + 600,
    800
  );

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-gk-bg"
      onScroll={handleScroll}
    >
      {/* Branch legend */}
      <div className="sticky top-0 z-10 flex items-center gap-4 px-4 py-2 bg-gk-bg-secondary/95 backdrop-blur border-b border-gk-border">
        <span className="text-xs text-gk-text-muted uppercase tracking-wider">Branches:</span>
        {branchLegend.map((bl) => (
          <div key={bl.name} className="flex items-center gap-1.5">
            <div 
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: bl.color }}
            />
            <span className="text-xs text-gk-text truncate max-w-24" title={bl.name}>
              {bl.name.replace('origin/', '')}
            </span>
          </div>
        ))}
      </div>

      <svg
        width={graphWidth}
        height={graphHeight}
        className="min-w-full"
      >
        {/* Branch lines */}
        {graphNodes.map((node, index) => (
          <BranchLine
            key={`line-${node.commit.hash}`}
            node={node}
            prevNode={index > 0 ? graphNodes[index - 1] : undefined}
            allNodes={graphNodes}
          />
        ))}

        {/* Commit nodes */}
        {graphNodes.map((node) => (
          <CommitNode
            key={node.commit.hash}
            node={node}
            isSelected={selectedCommit?.hash === node.commit.hash}
            onSelect={() => selectCommit(node.commit)}
          />
        ))}
      </svg>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
}

