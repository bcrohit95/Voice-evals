export const formatSampleRate = (hz: number | null): string =>
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
