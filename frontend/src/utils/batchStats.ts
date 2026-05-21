import type { Transcription } from '../types';

export interface BatchStats {
  avgWer:     number | null;
  bestWer:    number | null;
  worstWer:   number | null;
  bestModel:  string | null;
  totalCost:  number;
  avgLatency: number | null;
  count:      number;
}

export function calcBatchStats(transcriptions: Transcription[]): BatchStats {
  const done = transcriptions.filter(t => t.status === 'completed' && t.wer !== null);
  if (!done.length) return { avgWer: null, bestWer: null, worstWer: null, bestModel: null, totalCost: 0, avgLatency: null, count: 0 };

  const wers     = done.map(t => t.wer!);
  const bestWer  = Math.min(...wers);
  const bestT    = done.find(t => t.wer === bestWer);
  const latencies = done.filter(t => t.latency_seconds !== null).map(t => t.latency_seconds!);

  return {
    avgWer:     wers.reduce((a, b) => a + b, 0) / wers.length,
    bestWer,
    worstWer:   Math.max(...wers),
    bestModel:  bestT ? `${bestT.model_provider}/${bestT.model_name}` : null,
    totalCost:  done.reduce((s, t) => s + (t.cost_usd || 0), 0),
    avgLatency: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null,
    count:      done.length,
  };
}
