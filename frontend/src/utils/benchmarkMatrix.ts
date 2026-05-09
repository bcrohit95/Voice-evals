import type { Transcription } from '../types';

export interface MatrixCell {
  wer: number | null; latency: number | null;
  cost: number | null; status: string;
}
export type BenchmarkMatrix = Record<string, Record<string, MatrixCell>>;

export function buildMatrix(transcriptions: Transcription[]): BenchmarkMatrix {
  const matrix: BenchmarkMatrix = {};
  for (const t of transcriptions) {
    const model   = `${t.model_provider}/${t.model_name}`;
    const fileKey = String(t.audio_file_id);
    if (!matrix[fileKey]) matrix[fileKey] = {};
    matrix[fileKey][model] = {
      wer: t.wer, latency: t.latency_seconds,
      cost: t.cost_usd, status: t.status,
    };
  }
  return matrix;
}

export function bestModel(row: Record<string, MatrixCell>): string | null {
  return Object.entries(row)
    .filter(([, c]) => c.wer !== null)
    .sort(([, a], [, b]) => (a.wer ?? 999) - (b.wer ?? 999))[0]?.[0] ?? null;
}
