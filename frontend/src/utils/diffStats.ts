import type { DiffToken } from '../types';

export interface DiffStats {
  correct: number; deletions: number; insertions: number; total: number;
  accuracyPct: number;
}

export function calcDiffStats(tokens: DiffToken[]): DiffStats {
  const correct    = tokens.filter(t => t.type === 'correct').length;
  const deletions  = tokens.filter(t => t.type === 'deletion').length;
  const insertions = tokens.filter(t => t.type === 'insertion').length;
  const total      = correct + deletions + insertions;
  return {
    correct, deletions, insertions, total,
    accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 100,
  };
}

export function diffSummary(stats: DiffStats): string {
  return `${stats.correct} correct · ${stats.deletions} deleted · ${stats.insertions} inserted`;
}
