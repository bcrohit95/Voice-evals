export const wordCount = (text: string | null | undefined): number =>
  text ? text.trim().split(/\s+/).filter(Boolean).length : 0;

export const wordCountLabel = (text: string | null | undefined): string => {
  const n = wordCount(text);
  return `${n} word${n !== 1 ? 's' : ''}`;
};
