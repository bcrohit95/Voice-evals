export function werGrade(wer: number | null): string {
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
