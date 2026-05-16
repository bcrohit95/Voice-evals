export const METRIC_TOOLTIPS: Record<string, string> = {
  WER:     'Word Error Rate — % of words that are wrong. 0% is perfect, lower is better.',
  CER:     'Character Error Rate — same as WER but measures individual characters.',
  MER:     'Match Error Rate — stricter than WER; counts every substitution and deletion.',
  WIL:     'Word Information Lost — how much meaning was lost in the transcript.',
  Latency: 'How many seconds the API took to return the transcript.',
  Cost:    'Estimated API cost based on audio duration and the model\'s per-minute rate.',
};
