import React, { useEffect, useRef, useMemo } from 'react';
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
}

export function CommitGraph() {
  const { commits, selectedCommit, selectCommit, isLoading, loadMoreCommits, hasMore } = useCommitsStore();
  const branches = useBranchesStore((state) => state.branches);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate graph layout
  const graphNodes = useMemo(() => {
    const nodes: GraphNode[] = [];
    const columnMap = new Map<string, number>();
    let maxColumn = 0;

    commits.forEach((commit, index) => {
      // Find or assign column based on branch/parent relationships
      let column = 0;
      
      // Check if this commit has a branch ref
      const branchRef = commit.refs.find((ref) => 
        branches.some((b) => b.name === ref || ref.includes(b.name))
      );
      
      if (branchRef) {
        const existingColumn = columnMap.get(branchRef);
        if (existingColumn !== undefined) {
          column = existingColumn;
        } else {
          column = maxColumn;
          columnMap.set(branchRef, column);
          maxColumn++;
        }
      } else if (commit.parents.length > 0) {
        // Try to follow parent's column
        const parentColumn = columnMap.get(commit.parents[0]);
        if (parentColumn !== undefined) {
          column = parentColumn;
        }
      }

      // Assign color based on column
      const color = BRANCH_COLORS[column % BRANCH_COLORS.length];

      nodes.push({
        commit,
        x: GRAPH_CONFIG.SIDEBAR_WIDTH + column * GRAPH_CONFIG.NODE_SPACING_X + 20,
        y: index * GRAPH_CONFIG.COMMIT_HEIGHT + 25,
        color,
        column,
      });

      columnMap.set(commit.hash, column);
    });

    return nodes;
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
    ...graphNodes.map((n) => n.x + 200),
    600
  );

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto bg-gk-bg"
      onScroll={handleScroll}
    >
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

