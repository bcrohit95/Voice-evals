export function validateAudioFile(file: File): string | null {
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
