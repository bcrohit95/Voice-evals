export type SortKey = 'wer' | 'latency' | 'cost' | 'model';
export type SortDir = 'asc' | 'desc';

export interface LeaderboardRow {
  model: string; avgWer: number | null;
  avgLat: number | null; avgCost: number | null; runs: number;
}

export function sortLeaderboard(
  rows: LeaderboardRow[], key: SortKey, dir: SortDir = 'asc'
): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    let va: number | string = key === 'model' ? a.model : (a[key === 'wer' ? 'avgWer' : key === 'latency' ? 'avgLat' : 'avgCost'] ?? 999);
    let vb: number | string = key === 'model' ? b.model : (b[key === 'wer' ? 'avgWer' : key === 'latency' ? 'avgLat' : 'avgCost'] ?? 999);
    if (typeof va === 'string') return dir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });
}
