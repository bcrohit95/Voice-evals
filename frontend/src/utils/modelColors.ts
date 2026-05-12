export const MODEL_COLORS: Record<string, string> = {
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
