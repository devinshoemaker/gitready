import React from 'react';
import { GRAPH_CONFIG } from '../../../shared/constants';
import type { GitCommit } from '../../../shared/types/git.types';

interface GraphNode {
  commit: GitCommit;
  x: number;
  y: number;
  color: string;
  column: number;
}

interface CommitNodeProps {
  node: GraphNode;
  isSelected: boolean;
  onSelect: () => void;
}

export function CommitNode({ node, isSelected, onSelect }: CommitNodeProps) {
  const { commit, x, y, color } = node;
  
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
  const truncateMessage = (msg: string, maxLen: number = 60) => {
    if (msg.length <= maxLen) return msg;
    return msg.substring(0, maxLen) + '...';
  };

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

      {/* Node circle */}
      <circle
        cx={x}
        cy={y}
        r={GRAPH_CONFIG.NODE_RADIUS}
        fill={color}
        stroke={isSelected ? '#fff' : 'transparent'}
        strokeWidth={2}
        className="transition-all duration-150"
      />

      {/* Branch/tag refs */}
      {commit.refs.length > 0 && (
        <g>
          {commit.refs.slice(0, 2).map((ref, index) => {
            const isHead = ref === 'HEAD' || ref.includes('HEAD');
            const isBranch = ref.startsWith('refs/heads/') || !ref.includes('/');
            const isTag = ref.startsWith('refs/tags/') || ref.startsWith('tag:');
            
            const displayRef = ref
              .replace('refs/heads/', '')
              .replace('refs/tags/', '')
              .replace('HEAD -> ', '')
              .replace('tag: ', '');

            return (
              <g key={ref} transform={`translate(${x + 20 + index * 80}, ${y - 8})`}>
                <rect
                  x={0}
                  y={0}
                  width={displayRef.length * 7 + 12}
                  height={16}
                  rx={3}
                  fill={isHead ? '#00d9ff' : isTag ? '#fbbf24' : color}
                  opacity={0.2}
                />
                <text
                  x={6}
                  y={12}
                  fontSize={10}
                  fontFamily="JetBrains Mono, monospace"
                  fill={isHead ? '#00d9ff' : isTag ? '#fbbf24' : color}
                >
                  {displayRef}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* Commit info */}
      <g transform={`translate(${x + 100 + (commit.refs.length > 0 ? 80 : 0)}, ${y})`}>
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

        {/* Hash */}
        <text
          x={0}
          y={18}
          fontSize={11}
          fontFamily="JetBrains Mono, monospace"
          fill="#71717a"
          dominantBaseline="middle"
        >
          {commit.hashShort}
        </text>

        {/* Author and date */}
        <text
          x={60}
          y={18}
          fontSize={11}
          fontFamily="DM Sans, sans-serif"
          fill="#71717a"
          dominantBaseline="middle"
        >
          {commit.author.name} • {formatDate(commit.author.date)}
        </text>
      </g>
    </g>
  );
}

