export const storage = {
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
