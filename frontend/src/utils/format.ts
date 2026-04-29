export const fmt = {
  wer:      (v: number | null) => v !== null ? `${(v * 100).toFixed(2)}%` : '—',
  cer:      (v: number | null) => v !== null ? `${(v * 100).toFixed(2)}%` : '—',
  mer:      (v: number | null) => v !== null ? `${(v * 100).toFixed(2)}%` : '—',
  wil:      (v: number | null) => v !== null ? `${(v * 100).toFixed(2)}%` : '—',
  cost:     (v: number | null) => v !== null ? `$${v.toFixed(5)}` : '—',
  latency:  (v: number | null) => v !== null ? `${v.toFixed(2)}s` : '—',
  conf:     (v: number)        => `${(v * 100).toFixed(1)}%`,
  bytes:    (b: number) => {
    if (b < 1_024)      return `${b} B`;
    if (b < 1_048_576)  return `${(b / 1_024).toFixed(1)} KB`;
    return `${(b / 1_048_576).toFixed(1)} MB`;
  },
  duration: (s: number | null) => {
    if (!s) return '—';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  },
};
