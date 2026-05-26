export interface GTCheck { ok: boolean; warnings: string[] }

export function checkGroundTruth(text: string | null | undefined): GTCheck {
  const warnings: string[] = [];
  if (!text?.trim()) return { ok: false, warnings: ['Ground truth is empty.'] };
  const words = text.trim().split(/\s+/);
  if (words.length < 3) warnings.push('Ground truth is very short — less than 3 words.');
  if (/^[\d\s]+$/.test(text)) warnings.push('Ground truth contains only numbers.');
  if (text.length > 5000) warnings.push('Ground truth is very long — over 5000 characters.');
  if (/\btest\b|\bplaceholder\b|\bfoo\b|\bbar\b/i.test(text))
    warnings.push('Ground truth may be a placeholder value.');
  return { ok: warnings.length === 0, warnings };
}
