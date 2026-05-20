export interface PageInfo { page: number; pageSize: number; total: number }

export function paginate<T>(items: T[], page: number, pageSize = 10): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

export function pageCount(total: number, pageSize = 10): number {
  return Math.ceil(total / pageSize);
}

export function pageInfo(items: unknown[], page: number, pageSize = 10): PageInfo {
  return { page, pageSize, total: items.length };
}
