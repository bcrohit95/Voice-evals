import type { WordInfo } from '../types';

export function avgConfidence(words: WordInfo[]): number | null {
  const scored = words.filter(w => w.confidence > 0);
  if (!scored.length) return null;
  return scored.reduce((s, w) => s + w.confidence, 0) / scored.length;
}

export function confidenceLabel(score: number | null): string {
  if (score === null) return 'N/A';
  const pct = (score * 100).toFixed(1);
  if (score >= 0.9) return `${pct}% (Excellent)`;
  if (score >= 0.7) return `${pct}% (Good)`;
  if (score >= 0.5) return `${pct}% (Fair)`;
  return `${pct}% (Poor)`;
}
