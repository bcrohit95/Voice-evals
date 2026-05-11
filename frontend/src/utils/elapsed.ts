export function elapsedSeconds(start: string, end: string | null): number | null {
  if (!end) return null;
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
}

export function elapsedLabel(start: string, end: string | null): string {
  const s = elapsedSeconds(start, end);
  if (s === null) return 'In progress...';
  if (s < 60)     return `Completed in ${s}s`;
  return `Completed in ${Math.floor(s / 60)}m ${s % 60}s`;
}
