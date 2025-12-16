export type PaginationMeta = {
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
  [key: string]: any;
};

type PaginatedResponse<T> =
  | T[]
  | {
      data?: T[];
      pagination?: PaginationMeta;
      [key: string]: any;
    };

const normalizeItems = <T,>(res: PaginatedResponse<T>): T[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

const resolveHasMore = (pagination: PaginationMeta | undefined, items: unknown[], limit: number) => {
  const page = pagination?.page;
  const pages = pagination?.pages;

  if (typeof page === 'number' && typeof pages === 'number') {
    return page < pages;
  }

  return Array.isArray(items) && items.length === limit;
};

export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  options?: { limit?: number; maxPages?: number }
): Promise<{ items: T[]; pagination?: PaginationMeta }>{
  const limit = options?.limit ?? 50;
  const maxPages = options?.maxPages ?? 50;

  let page = 1;
  let allItems: T[] = [];
  let firstPagination: PaginationMeta | undefined;

  while (page <= maxPages) {
    const res = await fetchPage(page, limit);
    const items = normalizeItems<T>(res);
    const pagination: PaginationMeta | undefined =
      !Array.isArray(res) && typeof res === 'object' ? (res as any)?.pagination : undefined;

    if (!firstPagination && pagination) firstPagination = pagination;

    if (items.length) allItems = allItems.concat(items);

    const hasMore = resolveHasMore(pagination, items, limit);
    if (!hasMore) break;

    page += 1;
  }

  return { items: allItems, pagination: firstPagination };
}
