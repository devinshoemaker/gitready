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

interface BranchLineProps {
  node: GraphNode;
  prevNode?: GraphNode;
  allNodes: GraphNode[];
}

export function BranchLine({ node, prevNode, allNodes }: BranchLineProps) {
  const { x, y, color, commit } = node;

  // Find parent nodes
  const parentNodes = commit.parents
    .map((parentHash) => allNodes.find((n) => n.commit.hash === parentHash))
    .filter(Boolean) as GraphNode[];

  return (
    <g>
      {/* Line to previous node in same column */}
      {prevNode && prevNode.column === node.column && (
        <line
          x1={prevNode.x}
          y1={prevNode.y + GRAPH_CONFIG.NODE_RADIUS}
          x2={x}
          y2={y - GRAPH_CONFIG.NODE_RADIUS}
          stroke={color}
          strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
          strokeLinecap="round"
        />
      )}

      {/* Lines to parent commits (merge lines) */}
      {parentNodes.map((parentNode, index) => {
        if (!parentNode || (prevNode && parentNode.commit.hash === prevNode.commit.hash)) {
          return null;
        }

        const isSameColumn = parentNode.column === node.column;
        
        if (isSameColumn) {
          // Straight line
          return (
            <line
              key={`parent-${parentNode.commit.hash}`}
              x1={x}
              y1={y + GRAPH_CONFIG.NODE_RADIUS}
              x2={parentNode.x}
              y2={parentNode.y - GRAPH_CONFIG.NODE_RADIUS}
              stroke={color}
              strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
              strokeLinecap="round"
            />
          );
        } else {
          // Curved line for merges
          const midY = (y + parentNode.y) / 2;
          const path = `
            M ${x} ${y + GRAPH_CONFIG.NODE_RADIUS}
            C ${x} ${midY}, ${parentNode.x} ${midY}, ${parentNode.x} ${parentNode.y - GRAPH_CONFIG.NODE_RADIUS}
          `;

          return (
            <path
              key={`parent-${parentNode.commit.hash}`}
              d={path}
              stroke={index === 0 ? color : parentNode.color}
              strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
              fill="none"
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        }
      })}
    </g>
  );
}

