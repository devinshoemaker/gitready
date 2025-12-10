import React from 'react';
import { GRAPH_CONFIG } from '../../../shared/constants';
import type { GitCommit } from '../../../shared/types/git.types';

interface GraphNode {
  commit: GitCommit;
  x: number;
  y: number;
  color: string;
  column: number;
  branchName?: string;
}

interface CommitNodeProps {
  node: GraphNode;
  isSelected: boolean;
  onSelect: () => void;
}

export function CommitNode({ node, isSelected, onSelect }: CommitNodeProps) {
  const { commit, x, y, color } = node;
  const isMergeCommit = commit.parents.length > 1;
  
  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Truncate message
  const truncateMessage = (msg: string, maxLen: number = 50) => {
    if (msg.length <= maxLen) return msg;
    return msg.substring(0, maxLen) + '...';
  };

  // Parse refs to get display-friendly names
  const parseRefs = (refs: string[]) => {
    return refs.map((ref) => {
      const isHead = ref.includes('HEAD');
      const isRemote = ref.includes('origin/');
      const isTag = ref.startsWith('tag:') || ref.includes('refs/tags/');
      
      const displayName = ref
        .replace('HEAD -> ', '')
        .replace('refs/heads/', '')
        .replace('refs/tags/', '')
        .replace('refs/remotes/', '')
        .replace('tag: ', '');

      return { displayName, isHead, isRemote, isTag, original: ref };
    });
  };

  const parsedRefs = parseRefs(commit.refs);
  const nodeRadius = isMergeCommit ? GRAPH_CONFIG.NODE_RADIUS + 2 : GRAPH_CONFIG.NODE_RADIUS;

  // Calculate total width needed for refs
  let refOffset = 0;

  return (
    <g
      className="commit-node cursor-pointer"
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={0}
          y={y - 20}
          width="100%"
          height={GRAPH_CONFIG.COMMIT_HEIGHT}
          fill={`${color}10`}
          className="pointer-events-none"
        />
      )}

      {/* Node circle - different style for merge commits */}
      {isMergeCommit ? (
        // Merge commit: diamond/double circle
        <g>
          <circle
            cx={x}
            cy={y}
            r={nodeRadius}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
          <circle
            cx={x}
            cy={y}
            r={nodeRadius - 3}
            fill={color}
          />
        </g>
      ) : (
        // Regular commit: filled circle
        <circle
          cx={x}
          cy={y}
          r={nodeRadius}
          fill={color}
          stroke={isSelected ? '#fff' : 'transparent'}
          strokeWidth={2}
          className="transition-all duration-150"
        />
      )}

      {/* Branch/tag refs */}
      {parsedRefs.length > 0 && (
        <g>
          {parsedRefs.slice(0, 3).map((ref, index) => {
            const bgColor = ref.isHead ? '#00d9ff' : ref.isTag ? '#fbbf24' : ref.isRemote ? '#a855f7' : color;
            const textWidth = Math.min(ref.displayName.length * 6.5 + 12, 100);
            const xPos = x + 16 + refOffset;
            refOffset += textWidth + 4;

            return (
              <g key={ref.original} transform={`translate(${xPos}, ${y - 8})`}>
                <rect
                  x={0}
                  y={0}
                  width={textWidth}
                  height={16}
                  rx={3}
                  fill={bgColor}
                  opacity={0.2}
                />
                {ref.isHead && (
                  <rect
                    x={0}
                    y={0}
                    width={textWidth}
                    height={16}
                    rx={3}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={1}
                    opacity={0.5}
                  />
                )}
                <text
                  x={6}
                  y={12}
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  fill={bgColor}
                >
                  {ref.displayName.length > 14 
                    ? ref.displayName.substring(0, 12) + '..' 
                    : ref.displayName}
                </text>
              </g>
            );
          })}
          {parsedRefs.length > 3 && (
            <text
              x={x + 16 + refOffset}
              y={y}
              fontSize={10}
              fontFamily="JetBrains Mono, monospace"
              fill="#71717a"
              dominantBaseline="middle"
            >
              +{parsedRefs.length - 3}
            </text>
          )}
        </g>
      )}

      {/* Commit info */}
      <g transform={`translate(${x + 16 + Math.max(refOffset, 0) + (parsedRefs.length > 0 ? 8 : 0)}, ${y})`}>
        {/* Message */}
        <text
          x={0}
          y={0}
          fontSize={13}
          fontFamily="DM Sans, sans-serif"
          fill={isSelected ? '#fff' : '#e4e4e7'}
          dominantBaseline="middle"
        >
          {truncateMessage(commit.message)}
        </text>

        {/* Hash and author info on second line */}
        <text
          x={0}
          y={16}
          fontSize={11}
          fontFamily="JetBrains Mono, monospace"
          fill="#71717a"
          dominantBaseline="middle"
        >
          {commit.hashShort}
          <tspan fontFamily="DM Sans, sans-serif" dx={8}>
            {commit.author.name} • {formatDate(commit.author.date)}
          </tspan>
          {isMergeCommit && (
            <tspan fill="#a855f7" dx={8}>
              merge
            </tspan>
          )}
        </text>
      </g>
    </g>
  );
}
