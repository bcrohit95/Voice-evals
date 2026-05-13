export function filterByQuery<T extends Record<string, unknown>>(
  rows: T[], query: string, keys: (keyof T)[]
): T[] {
  if (!query.trim()) return rows;
  const q = query.toLowerCase();
  return rows.filter(r =>
    keys.some(k => String(r[k] ?? '').toLowerCase().includes(q))
  );
}
