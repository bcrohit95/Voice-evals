export interface AudioFile {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  duration_seconds: number | null;
  sample_rate: number | null;
  file_size_bytes: number;
  batch_id: string | null;
  ground_truth: string | null;
  created_at: string;
}

export interface WordInfo {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface SpeakerLabel {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export type TranscriptionStatus = "pending" | "running" | "completed" | "failed";

export interface Transcription {
  id: number;
  audio_file_id: number;
  model_provider: string;
  model_name: string;
  transcript_text: string | null;
  word_level_data: WordInfo[] | null;
  speaker_labels: SpeakerLabel[] | null;
  latency_seconds: number | null;
  cost_usd: number | null;
  wer: number | null;
  cer: number | null;
  mer: number | null;
  wil: number | null;
  status: TranscriptionStatus;
  error_message: string | null;
  benchmark_run_id: number | null;
  created_at: string;
}

export interface BenchmarkRun {
  id: number;
  name: string;
  model_names: string[];
  file_ids: number[];
  status: string;
  total_transcriptions: number;
  completed_transcriptions: number;
  created_at: string;
  completed_at: string | null;
  transcriptions: Transcription[];
}

export interface DiffToken {
  word: string;
  type: "correct" | "deletion" | "insertion";
}

export interface BenchmarkSummaryRow {
  model: string;
  avg_wer: number | null;
  avg_latency: number | null;
  total_cost: number | null;
  samples: number;
}
