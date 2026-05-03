export const MODEL_PRICING = [
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
