import type { SpeakerLabel } from '../types';

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
