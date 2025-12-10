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

interface BranchLineProps {
  node: GraphNode;
  prevNode?: GraphNode;
  allNodes: GraphNode[];
}

export function BranchLine({ node, allNodes }: BranchLineProps) {
  const { commit, x, y, color, column } = node;
  const nodeRadius = GRAPH_CONFIG.NODE_RADIUS;

  // Find parent nodes in the graph
  const parentNodes = commit.parents
    .map((parentHash) => allNodes.find((n) => n.commit.hash === parentHash))
    .filter((n): n is GraphNode => n !== undefined);

  // If no parents found in current view, draw line to bottom
  if (parentNodes.length === 0 && commit.parents.length > 0) {
    // Draw a line going down indicating more history
    const lastNode = allNodes[allNodes.length - 1];
    if (node === lastNode) {
      return (
        <line
          x1={x}
          y1={y + nodeRadius}
          x2={x}
          y2={y + GRAPH_CONFIG.COMMIT_HEIGHT}
          stroke={color}
          strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.5}
        />
      );
    }
  }

  return (
    <g>
      {parentNodes.map((parentNode, index) => {
        const parentX = parentNode.x;
        const parentY = parentNode.y;
        const parentColor = parentNode.color;
        
        const isSameColumn = parentNode.column === column;
        const isFirstParent = index === 0;
        
        // Determine the color to use
        // For first parent (direct line), use node's color
        // For second parent (merge), use the parent's color
        const lineColor = isFirstParent ? color : parentColor;
        
        if (isSameColumn) {
          // Straight vertical line
          return (
            <line
              key={`parent-${parentNode.commit.hash}`}
              x1={x}
              y1={y + nodeRadius}
              x2={parentX}
              y2={parentY - nodeRadius}
              stroke={lineColor}
              strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
              strokeLinecap="round"
            />
          );
        } else {
          // Curved line for merges or branch forks
          const startY = y + nodeRadius;
          const endY = parentY - nodeRadius;
          const midY = (startY + endY) / 2;
          
          // Determine if this is a fork (going right) or merge (going left)
          const isFork = parentNode.column > column;
          
          // Create a smooth bezier curve
          const controlOffset = Math.abs(parentX - x) * 0.5;
          
          let path: string;
          if (isFork) {
            // Fork: starts at node, curves right to parent
            path = `
              M ${x} ${startY}
              L ${x} ${midY - 10}
              C ${x} ${midY + 10}, ${parentX} ${midY - 10}, ${parentX} ${midY + 10}
              L ${parentX} ${endY}
            `;
          } else {
            // Merge: starts at node, curves left to parent  
            path = `
              M ${x} ${startY}
              C ${x} ${startY + controlOffset}, ${parentX} ${endY - controlOffset}, ${parentX} ${endY}
            `;
          }

          return (
            <path
              key={`parent-${parentNode.commit.hash}`}
              d={path}
              stroke={lineColor}
              strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
              fill="none"
              strokeLinecap="round"
              opacity={isFirstParent ? 1 : 0.7}
            />
          );
        }
      })}
      
      {/* Draw vertical line segment if this commit is not at the top and has no child in view */}
      {allNodes.length > 0 && node === allNodes[0] && (
        <line
          x1={x}
          y1={0}
          x2={x}
          y2={y - nodeRadius}
          stroke={color}
          strokeWidth={GRAPH_CONFIG.LINE_WIDTH}
          strokeLinecap="round"
          strokeDasharray="4 4"
          opacity={0.3}
        />
      )}
    </g>
  );
}
