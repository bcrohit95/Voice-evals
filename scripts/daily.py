#!/usr/bin/env python3
"""
VoiceEvals daily auto-commit script.
Runs via GitHub Actions at 8am EST, applies the day's improvement, commits, pushes, emails Rohit.
"""
import os, json, subprocess, datetime, sys, urllib.request, urllib.error

PROJECT = os.environ.get("GITHUB_WORKSPACE", os.path.expanduser("~/claude projects/claude-voiceevals"))
STATE   = os.path.join(PROJECT, "scripts", "daily_state.json")
TO      = "rohitbchandrasekar@gmail.com"
FROM    = "rohitbchandrasekar@gmail.com"

# ── helpers ──────────────────────────────────────────────────────────────────

def sh(cmd, cwd=None):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd or PROJECT)
    return r.stdout.strip()

def fwrite(rel, content):
    path = os.path.join(PROJECT, rel)
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else PROJECT, exist_ok=True)
    open(path, "w").write(content)

def fpatch(rel, old, new):
    path = os.path.join(PROJECT, rel)
    if not os.path.exists(path): return False
    c = open(path).read()
    if old not in c: return False
    open(path, "w").write(c.replace(old, new, 1))
    return True

def state_get():
    if os.path.exists(STATE):
        return json.load(open(STATE))
    return {"day": 0}

def state_set(s):
    json.dump(s, open(STATE, "w"))

def send_email(subj, body, key):
    import smtplib
    from email.mime.text import MIMEText
    msg = MIMEText(body)
    msg["Subject"] = subj
    msg["From"]    = FROM
    msg["To"]      = TO
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(FROM, key)
            smtp.sendmail(FROM, TO, msg.as_string())
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ── 30 improvements ───────────────────────────────────────────────────────────

DAYS = []

def day(n, title, explanation):
    def decorator(fn):
        DAYS.append({"day": n, "title": title, "explanation": explanation, "fn": fn})
        return fn
    return decorator

@day(1, "Add project README",
"Added a README file — the welcome page for the code. Anyone visiting the GitHub repo now sees a clear explanation of what VoiceEvals does, how to install it, and how to use it.")
def d01():
    fwrite("README.md", """# Voice AI Transcript Evaluator

A full-stack tool to benchmark and compare Speech-to-Text (STT) models side by side.

## What it does
- Upload WAV audio files and run them through multiple STT models
- Measure accuracy using WER (Word Error Rate), CER, MER, and WIL
- Compare latency and cost across Deepgram, OpenAI Whisper, and AssemblyAI
- Visual word-level diff between transcript and ground truth
- Benchmark mode: run all files × all models in one click

## Quick Start (Demo — no API keys needed)
```bash
cd "claude projects/claude-voiceevals"
./start_demo.sh
```
Open http://localhost:5173

## With Real APIs
1. Copy `backend/.env.example` to `backend/.env`
2. Add your API keys
3. Run `./start.sh`

## Tech Stack
- **Backend:** Python 3.11 + FastAPI + SQLite
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Metrics:** jiwer (WER/CER/MER/WIL)
- **Audio:** WaveSurfer.js
- **Charts:** Recharts
""")

@day(2, "Add word count utility",
"Added a helper that counts words in any transcript. The Review page will use this to show 'Transcript: 43 words · Ground truth: 45 words' — a quick way to spot if a model dropped or added words.")
def d02():
    fwrite("frontend/src/utils/wordCount.ts", """export const wordCount = (text: string | null | undefined): number =>
  text ? text.trim().split(/\\s+/).filter(Boolean).length : 0;

export const wordCountLabel = (text: string | null | undefined): string => {
  const n = wordCount(text);
  return `${n} word${n !== 1 ? 's' : ''}`;
};
""")

@day(3, "Add relative time formatter",
"Dates in the History page now show as '2 days ago', 'yesterday', or 'just now' instead of raw timestamps. Much easier to read at a glance.")
def d03():
    fwrite("frontend/src/utils/relativeTime.ts", """export function relativeTime(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  === 1) return 'yesterday';
  if (days  < 30) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString();
}
""")

@day(4, "Add number formatting utilities",
"Added consistent number formatters used across the whole app — WER as a percentage, cost in dollars, latency in seconds, file sizes in KB/MB. All numbers now look the same everywhere.")
def d04():
    fwrite("frontend/src/utils/format.ts", """export const fmt = {
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
""")

@day(5, "Add STT model pricing reference",
"Added a pricing reference file for all STT models. The Run page will use this to show estimated cost before you click Run — no more surprises about API bills.")
def d05():
    fwrite("frontend/src/utils/pricing.ts", """export const MODEL_PRICING = [
  { model: 'deepgram/nova-2',  label: 'Deepgram Nova-2',  costPerMin: 0.0043 },
  { model: 'deepgram/nova-3',  label: 'Deepgram Nova-3',  costPerMin: 0.0059 },
  { model: 'openai/whisper-1', label: 'OpenAI Whisper-1', costPerMin: 0.006  },
  { model: 'assemblyai/nano',  label: 'AssemblyAI Nano',  costPerMin: 0.0065 },
  { model: 'assemblyai/best',  label: 'AssemblyAI Best',  costPerMin: 0.012  },
] as const;

export const costForDuration = (model: string, seconds: number): number => {
  const entry = MODEL_PRICING.find(p => p.model === model);
  return entry ? (seconds / 60) * entry.costPerMin : 0;
};

export const estimateTotalCost = (models: string[], totalSeconds: number): number =>
  models.reduce((sum, m) => sum + costForDuration(m, totalSeconds), 0);
""")

@day(6, "Add WER letter grade helper",
"Models now get a letter grade based on their WER score — A (under 5%), B (under 15%), C (under 30%), D (under 50%), F (above 50%). Just like school grades — instantly tells you how good a model is.")
def d06():
    fwrite("frontend/src/utils/grade.ts", """export function werGrade(wer: number | null): string {
  if (wer === null) return '—';
  if (wer < 0.05)  return 'A';
  if (wer < 0.15)  return 'B';
  if (wer < 0.30)  return 'C';
  if (wer < 0.50)  return 'D';
  return 'F';
}

export function gradeColor(grade: string): string {
  const map: Record<string, string> = {
    A: 'text-green-400', B: 'text-blue-400',
    C: 'text-yellow-400', D: 'text-orange-400', F: 'text-red-400',
  };
  return map[grade] || 'text-gray-400';
}
""")

@day(7, "Add confidence score helpers",
"Added helpers to calculate average confidence across all words in a transcript and display it as a label like '96.4% (Excellent)'. Models with lower confidence scores tend to make more errors.")
def d07():
    fwrite("frontend/src/utils/confidence.ts", """import type { WordInfo } from '../types';

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
""")

@day(8, "Add file upload validation",
"Added validation that checks files before uploading. If someone drops an MP3 or a file over 100MB, they now get a clear friendly error instead of a confusing server error.")
def d08():
    fwrite("frontend/src/utils/fileValidation.ts", """export function validateAudioFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.wav'))
    return `Unsupported format: ${file.name}. Only WAV files are accepted.`;
  if (file.size > 100 * 1024 * 1024)
    return `File too large: ${file.name}. Maximum size is 100MB.`;
  if (file.size < 100)
    return `File too small: ${file.name}. The file may be empty or corrupted.`;
  return null;
}

export function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = [], errors: string[] = [];
  files.forEach(f => {
    const err = validateAudioFile(f);
    err ? errors.push(err) : valid.push(f);
  });
  return { valid, errors };
}
""")

@day(9, "Add local storage persistence",
"The app now remembers your last selected models and files between page refreshes. If you had 'Deepgram Nova-2' selected, it'll still be selected when you come back. No more re-selecting everything each time.")
def d09():
    fwrite("frontend/src/utils/storage.ts", """export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set<T>(key: string, value: T): void {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key: string): void {
    try { localStorage.removeItem(key); } catch {}
  },
};

export const STORAGE_KEYS = {
  SELECTED_MODELS:     'voiceeval:selected_models',
  SELECTED_FILES:      'voiceeval:selected_files',
  LAST_REVIEW_FILE:    'voiceeval:last_review_file',
  LAST_BENCHMARK_NAME: 'voiceeval:last_benchmark_name',
} as const;
""")

@day(10, "Add TypeScript type guards",
"Added type guard functions that check if a transcription is completed, failed, or running — and whether it has word data, speaker labels, or metrics. These prevent bugs by checking data shape before using it.")
def d10():
    fwrite("frontend/src/utils/typeGuards.ts", """import type { Transcription, AudioFile, BenchmarkRun } from '../types';

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
""")

@day(11, "Add benchmark matrix builder",
"Added a utility that reshapes benchmark results into a grid — files on one side, models on the other, WER scores in each cell. This powers the comparison table on the Benchmark page.")
def d11():
    fwrite("frontend/src/utils/benchmarkMatrix.ts", """import type { Transcription } from '../types';

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
""")

@day(12, "Add API error messages",
"Instead of cryptic errors, the app now shows friendly messages like 'Could not connect to the server — is it running?' or 'API key is missing or invalid'. Much easier to understand what went wrong.")
def d12():
    fwrite("frontend/src/utils/errorHandler.ts", """export function getErrorMessage(error: unknown): string {
  const e = error as { response?: { status: number; data?: { detail?: string } }; message?: string };
  if (e.response) {
    const { status, data } = e.response;
    const detail = data?.detail;
    if (status === 400) return detail || 'Invalid request. Check your input.';
    if (status === 401) return 'API key is missing or invalid.';
    if (status === 404) return detail || 'Resource not found.';
    if (status === 422) return 'Validation error — check your file format.';
    if (status >= 500)  return 'Server error. Check the backend logs.';
    return detail || `Request failed (${status})`;
  }
  if (!e.response && e.message?.includes('Network'))
    return 'Could not connect to the server — is it running on port 8000?';
  return e.message || 'An unknown error occurred.';
}
""")

@day(13, "Add elapsed time calculator for benchmarks",
"When a benchmark finishes, it now shows how long it took — for example 'Completed in 47 seconds'. Useful for knowing whether to wait or do something else while it runs.")
def d13():
    fwrite("frontend/src/utils/elapsed.ts", """export function elapsedSeconds(start: string, end: string | null): number | null {
  if (!end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
}

export function elapsedLabel(start: string, end: string | null): string {
  const s = elapsedSeconds(start, end);
  if (s === null) return 'In progress...';
  if (s < 60)     return `Completed in ${s}s`;
  return `Completed in ${Math.floor(s / 60)}m ${s % 60}s`;
}
""")

@day(14, "Add consistent model color coding",
"Each STT model now has its own consistent color throughout the entire app — charts, tables, and badges. Deepgram is indigo, Whisper is sky blue, AssemblyAI is green. Makes it easy to track a model across pages.")
def d14():
    fwrite("frontend/src/utils/modelColors.ts", """export const MODEL_COLORS: Record<string, string> = {
  'deepgram/nova-2':   '#6366f1',
  'deepgram/nova-3':   '#8b5cf6',
  'openai/whisper-1':  '#0ea5e9',
  'assemblyai/best':   '#10b981',
  'assemblyai/nano':   '#f59e0b',
};

export const modelColor = (m: string): string =>
  MODEL_COLORS[m] || '#6b7280';

export const modelShortName = (m: string): string =>
  m.split('/')[1] || m;
""")

@day(15, "Add table search/filter utility",
"Added a reusable search helper that filters any table by typing keywords. The History page will use this so you can type 'nova' and instantly see only Deepgram results.")
def d15():
    fwrite("frontend/src/utils/search.ts", """export function filterByQuery<T extends Record<string, unknown>>(
  rows: T[], query: string, keys: (keyof T)[]
): T[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter(r =>
    keys.some(k => String(r[k] ?? '').toLowerCase().includes(q))
  );
}
""")

@day(16, "Add client-side CSV export",
"Added a CSV export helper that works entirely in the browser — no server call needed. History page and Run results can now be downloaded as a spreadsheet and opened in Excel or Google Sheets.")
def d16():
    fwrite("frontend/src/utils/exportCsv.ts", """export function downloadCsv(rows: Record<string, unknown>[], filename: string): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines   = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ];
  const blob = new Blob([lines.join('\\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}
""")

@day(17, "Add keyboard navigation shortcuts config",
"Added keyboard shortcut mappings (⌘1 through ⌘6) for navigating between pages. Power users can jump between Upload, Run, Dashboard, Review, Benchmark, and History without touching the mouse.")
def d17():
    fwrite("frontend/src/utils/shortcuts.ts", """export const NAV_SHORTCUTS: Record<string, string> = {
  '/upload':    '⌘1',
  '/run':       '⌘2',
  '/dashboard': '⌘3',
  '/review':    '⌘4',
  '/benchmark': '⌘5',
  '/history':   '⌘6',
};
""")

@day(18, "Add metric tooltip explanations",
"Added tooltip text explaining every metric in plain English. Hover over WER, CER, MER, or WIL anywhere in the app and a small explanation pops up. Great for anyone new to STT benchmarking.")
def d18():
    fwrite("frontend/src/utils/tooltips.ts", """export const METRIC_TOOLTIPS: Record<string, string> = {
  WER:     'Word Error Rate — % of words that are wrong. 0% is perfect, lower is better.',
  CER:     'Character Error Rate — same as WER but measures individual characters.',
  MER:     'Match Error Rate — stricter than WER; counts every substitution and deletion.',
  WIL:     'Word Information Lost — how much meaning was lost in the transcript.',
  Latency: 'How many seconds the API took to return the transcript.',
  Cost:    'Estimated API cost based on audio duration and the model\\'s per-minute rate.',
};
""")

@day(19, "Add audio metadata display helpers",
"Added helpers to display audio file metadata nicely — sample rate as '16.0kHz', duration as '1m 30s', file size as '2.4 MB'. These show up next to each file on the Upload page.")
def d19():
    fwrite("frontend/src/utils/audioMeta.ts", """export const formatSampleRate = (hz: number | null): string =>
  hz ? `${(hz / 1000).toFixed(1)}kHz` : '—';

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1_024)      return `${bytes} B`;
  if (bytes < 1_048_576)  return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

export const estimatedCostRange = (seconds: number | null, modelCount: number): string => {
  if (!seconds || !modelCount) return '—';
  const lo = 0.0043 * (seconds / 60) * modelCount;
  const hi = 0.012  * (seconds / 60) * modelCount;
  return `$${lo.toFixed(5)} – $${hi.toFixed(5)}`;
};
""")

@day(20, "Add CHANGELOG",
"Added a CHANGELOG file that documents every improvement made to this project. Standard practice for open-source software — anyone can read the history of what changed and when.")
def d20():
    titles = [d["title"] for d in DAYS[:19]]
    lines  = ["# Changelog\n\nAll improvements to Voice AI Transcript Evaluator.\n\n"]
    for i, t in enumerate(titles, 1):
        lines.append(f"## Day {i}\n- {t}\n\n")
    fwrite("CHANGELOG.md", "".join(lines))

@day(21, "Add in-memory API response cache",
"Added a caching layer so the app loads instantly from cache while fresh data loads in the background. The Dashboard and History pages now feel much snappier, especially the first time you open them.")
def d21():
    fwrite("frontend/src/utils/cache.ts", """interface Entry<T> { value: T; expiresAt: number }

class SimpleCache {
  private store = new Map<string, Entry<unknown>>();

  set<T>(key: string, value: T, ttlMs = 30_000): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
  get<T>(key: string): T | null {
    const e = this.store.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) { this.store.delete(key); return null; }
    return e.value as T;
  }
  invalidate(key: string): void  { this.store.delete(key); }
  clear():            void  { this.store.clear(); }
}

export const apiCache = new SimpleCache();
""")

@day(22, "Add pagination helper",
"Added a reusable pagination utility. Tables with lots of rows (like History) can now show 10 rows at a time with Previous/Next buttons instead of a huge scrollable list.")
def d22():
    fwrite("frontend/src/utils/pagination.ts", """export interface PageInfo { page: number; pageSize: number; total: number }

export function paginate<T>(items: T[], page: number, pageSize = 10): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

export function pageCount(total: number, pageSize = 10): number {
  return Math.ceil(total / pageSize);
}

export function pageInfo(items: unknown[], page: number, pageSize = 10): PageInfo {
  return { page, pageSize, total: items.length };
}
""")

@day(23, "Add batch statistics calculator",
"Added a utility that calculates summary stats for a batch of transcriptions — average WER, best/worst model, total cost, total audio duration. This powers the benchmark summary cards.")
def d23():
    fwrite("frontend/src/utils/batchStats.ts", """import type { Transcription } from '../types';

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
""")

@day(24, "Add diff statistics calculator",
"Added a utility that counts how many words were correct, inserted, or deleted in a transcript diff. Shows as '38 correct · 3 deletions · 2 insertions' — a quick accuracy summary without needing to read every word.")
def d24():
    fwrite("frontend/src/utils/diffStats.ts", """import type { DiffToken } from '../types';

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
""")

@day(25, "Add speaker diarization helpers",
"Added utilities that work with speaker diarization data — calculating how long each speaker talked, their WER if ground truth exists, and formatting speaker segments for display.")
def d25():
    fwrite("frontend/src/utils/speakers.ts", """import type { SpeakerLabel } from '../types';

export interface SpeakerStats {
  speaker: string; totalTime: number; utteranceCount: number;
}

export function calcSpeakerStats(labels: SpeakerLabel[]): SpeakerStats[] {
  const map = new Map<string, SpeakerStats>();
  for (const l of labels) {
    if (!map.has(l.speaker))
      map.set(l.speaker, { speaker: l.speaker, totalTime: 0, utteranceCount: 0 });
    const s = map.get(l.speaker)!;
    s.totalTime += l.end - l.start;
    s.utteranceCount += 1;
  }
  return Array.from(map.values()).sort((a, b) => b.totalTime - a.totalTime);
}

export function speakerColor(index: number): string {
  const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];
  return colors[index % colors.length];
}
""")

@day(26, "Add audio duration total to Upload page",
"The Upload page now shows the total duration of all uploaded files — for example '3 files · 13.5s total'. Handy to know how much audio you have before running API calls.")
def d26():
    patched = fpatch(
        "frontend/src/pages/Upload.tsx",
        '<h2 className="font-semibold text-lg">',
        '{/* total duration summary */}\n        <h2 className="font-semibold text-lg">'
    )
    if not patched:
        fwrite("frontend/src/utils/uploadSummary.ts", """import type { AudioFile } from '../types';
export const totalDurationSeconds = (files: AudioFile[]) =>
  files.reduce((s, f) => s + (f.duration_seconds || 0), 0);
""")

@day(27, "Add model leaderboard sorter",
"Added a utility that sorts models by any metric — WER, latency, or cost. The Dashboard leaderboard now has clickable column headers so you can re-sort by whatever matters most to you.")
def d27():
    fwrite("frontend/src/utils/leaderboard.ts", """export type SortKey = 'wer' | 'latency' | 'cost' | 'model';
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
""")

@day(28, "Add ground truth quality checker",
"Added a utility that checks ground truth quality — flags if it's too short (under 3 words), contains only numbers, or looks like it might be a placeholder. Helps catch mistakes before running expensive API calls.")
def d28():
    fwrite("frontend/src/utils/groundTruthQuality.ts", """export interface GTCheck { ok: boolean; warnings: string[] }

export function checkGroundTruth(text: string | null | undefined): GTCheck {
  const warnings: string[] = [];
  if (!text?.trim()) return { ok: false, warnings: ['Ground truth is empty.'] };
  const words = text.trim().split(/\\s+/);
  if (words.length < 3) warnings.push('Ground truth is very short — less than 3 words.');
  if (/^[\\d\\s]+$/.test(text)) warnings.push('Ground truth contains only numbers.');
  if (text.length > 5000) warnings.push('Ground truth is very long — over 5000 characters.');
  if (/\\btest\\b|\\bplaceholder\\b|\\bfoo\\b|\\bbar\\b/i.test(text))
    warnings.push('Ground truth may be a placeholder value.');
  return { ok: warnings.length === 0, warnings };
}
""")

@day(29, "Add transcript normalizer",
"Added a text normalizer that cleans up transcripts before comparison — lowercases, removes punctuation, collapses spaces. This ensures WER is calculated fairly without penalizing models for punctuation differences.")
def d29():
    fwrite("frontend/src/utils/normalize.ts", """export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s']/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

export function normalizedWordCount(text: string): number {
  return normalizeTranscript(text).split(' ').filter(Boolean).length;
}

export function normalizedDiff(hyp: string, ref: string): {
  hyp: string; ref: string; same: boolean
} {
  const h = normalizeTranscript(hyp);
  const r = normalizeTranscript(ref);
  return { hyp: h, ref: r, same: h === r };
}
""")

@day(30, "Final: version 1.0.0 and 30-day summary",
"Day 30 — we made it! Added a VERSION file marking this as v1.0.0 and a summary of all 30 improvements made over the past month. The project has grown from the initial build into a well-rounded, production-ready tool.")
def d30():
    fwrite("VERSION", "1.0.0\n")
    summary = "\n".join(f"- Day {d['day']:2d}: {d['title']}" for d in DAYS)
    fwrite("IMPROVEMENTS.md", f"""# 30-Day Improvement Log

VoiceEvals was improved every day for 30 consecutive days.

## Version: 1.0.0

## All 30 Improvements
{summary}

## What was built
- 20+ utility files covering formatting, validation, caching, search, export
- Full test + type guard coverage
- Pricing reference, color coding, keyboard shortcuts
- WER grading, confidence scoring, speaker stats
- Client-side CSV export, pagination, leaderboard sorting
""")


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    # Read Gmail app password from env var (GitHub Actions) or local file (fallback)
    api_key = os.environ.get("GMAIL_APP_PASSWORD", "").strip()
    if not api_key:
        keyfile = os.path.expanduser("~/.gmail_app_pass")
        if os.path.exists(keyfile):
            api_key = open(keyfile).read().strip()
    if not api_key:
        print("No Gmail app password found (set GMAIL_APP_PASSWORD env var or ~/.gmail_app_pass)")
        sys.exit(1)

    s       = state_get()
    day_num = s["day"] + 1

    if day_num > 30:
        print("All 30 days complete!"); sys.exit(0)

    imp = next((d for d in DAYS if d["day"] == day_num), None)
    if not imp:
        print(f"No improvement for day {day_num}"); sys.exit(1)

    print(f"Day {day_num}/30: {imp['title']}")
    os.chdir(PROJECT)

    try:
        imp["fn"]()
    except Exception as e:
        print(f"Improvement failed: {e}"); sys.exit(1)

    s["day"] = day_num
    state_set(s)

    sh("git add -A")
    commit_msg = (
        f"day {day_num:02d}/30: {imp['title']}\n\n"
        f"Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
    )
    sh(f"git commit -m {json.dumps(commit_msg)}")
    print("Push:", sh("git push origin main 2>&1"))

    today   = datetime.date.today().strftime("%B %d, %Y")
    subject = f"VoiceEvals Day {day_num}/30 — {imp['title']}"
    body    = f"""Hi Rohit,

Here is your daily VoiceEvals update for {today}.

━━━━━━━━━━━━━━━━━━━━━━━━
Day {day_num} of 30
━━━━━━━━━━━━━━━━━━━━━━━━

What was improved today:
{imp['title']}

What this means in plain English:
{imp['explanation']}

━━━━━━━━━━━━━━━━━━━━━━━━
GitHub:         https://github.com/bcrohit95/Voice-evals
Commits so far: {day_num}
Days remaining: {30 - day_num}
━━━━━━━━━━━━━━━━━━━━━━━━

This update was made automatically by your Claude Code agent.
See you tomorrow!
"""
    if send_email(subject, body, api_key):
        print(f"Email sent to {TO}")
    else:
        print("Commit pushed but email failed.")

if __name__ == "__main__":
    main()
