import React from 'react';
import { BranchItem } from './BranchItem';
import type { GitBranch } from '../../../shared/types/git.types';

interface BranchListProps {
  branches: GitBranch[];
}

export function BranchList({ branches }: BranchListProps) {
  if (branches.length === 0) {
    return (
      <div className="px-4 py-2 text-sm text-gk-text-muted">
        No branches
      </div>
    );
  }

  return (
    <div className="py-1">
      {branches.map((branch) => (
        <BranchItem key={branch.name} branch={branch} />
      ))}
    </div>
  );
}

