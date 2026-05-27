export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
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
