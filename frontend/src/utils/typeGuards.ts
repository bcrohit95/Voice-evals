import type { Transcription, AudioFile, BenchmarkRun } from '../types';

export const isCompleted  = (t: Transcription) => t.status === 'completed';
export const hasFailed    = (t: Transcription) => t.status === 'failed';
export const isRunning    = (t: Transcription) => t.status === 'running' || t.status === 'pending';
export const hasMetrics   = (t: Transcription) => t.wer !== null;
export const hasWordData  = (t: Transcription) => !!(t.word_level_data?.length);
export const hasSpeakers  = (t: Transcription) => !!(t.speaker_labels?.length);
export const hasGroundTruth = (f: AudioFile)   => !!f.ground_truth?.trim();
export const benchmarkDone  = (b: BenchmarkRun) => b.status === 'completed';
export const benchmarkPct   = (b: BenchmarkRun) =>
  b.total_transcriptions > 0
    ? Math.round((b.completed_transcriptions / b.total_transcriptions) * 100)
    : 0;
