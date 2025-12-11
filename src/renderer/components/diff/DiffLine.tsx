import type { GitDiffLine } from '../../../shared/types/git.types';

interface DiffLineProps {
  line: GitDiffLine;
  mode: 'unified' | 'split-old' | 'split-new';
}

export function DiffLine({ line, mode }: DiffLineProps) {
  const getLineStyle = () => {
    switch (line.type) {
      case 'add':
        return 'diff-line-add';
      case 'delete':
        return 'diff-line-delete';
      default:
        return 'diff-line-context';
    }
  };

  const getLinePrefix = () => {
    if (mode === 'unified') {
      switch (line.type) {
        case 'add':
          return '+';
        case 'delete':
          return '-';
        default:
          return ' ';
      }
    }
    return '';
  };

  const getLineNumber = () => {
    if (mode === 'split-old') {
      return line.oldLineNumber;
    } else if (mode === 'split-new') {
      return line.newLineNumber;
    } else {
      // Unified mode
      if (line.type === 'add') {
        return { old: '', new: line.newLineNumber };
      } else if (line.type === 'delete') {
        return { old: line.oldLineNumber, new: '' };
      } else {
        return { old: line.oldLineNumber, new: line.newLineNumber };
      }
    }
  };

  const lineNumber = getLineNumber();

  return (
    <div className={`diff-line flex ${getLineStyle()}`}>
      {/* Line numbers */}
      {mode === 'unified' ? (
        <>
          <span className="w-12 px-2 text-right text-gk-text-muted/50 select-none border-r border-gk-border/30">
            {typeof lineNumber === 'object' ? lineNumber.old : ''}
          </span>
          <span className="w-12 px-2 text-right text-gk-text-muted/50 select-none border-r border-gk-border/30">
            {typeof lineNumber === 'object' ? lineNumber.new : ''}
          </span>
        </>
      ) : (
        <span className="w-12 px-2 text-right text-gk-text-muted/50 select-none border-r border-gk-border/30">
          {lineNumber as number}
        </span>
      )}

      {/* Prefix */}
      <span className="w-6 text-center select-none">{getLinePrefix()}</span>

      {/* Content */}
      <span className="flex-1 px-2 whitespace-pre overflow-x-auto">
        {line.content}
      </span>
    </div>
  );
}

