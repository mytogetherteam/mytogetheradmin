const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export type ShopsManageListPagination = {
  page: number;
  pageSize: number;
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : fallback;
}

export function parseShopsManagePagination(
  searchParams: URLSearchParams,
): ShopsManageListPagination {
  return {
    page: parsePositiveInt(searchParams.get('page'), DEFAULT_PAGE),
    pageSize: parsePositiveInt(searchParams.get('pageSize'), DEFAULT_PAGE_SIZE),
  };
}

export function parseShopsManageReturnPagination(
  searchParams: URLSearchParams,
): ShopsManageListPagination {
  return {
    page: parsePositiveInt(
      searchParams.get('returnPage') ?? searchParams.get('page'),
      DEFAULT_PAGE,
    ),
    pageSize: parsePositiveInt(
      searchParams.get('returnPageSize') ?? searchParams.get('pageSize'),
      DEFAULT_PAGE_SIZE,
    ),
  };
}

export function applyShopsManagePaginationToParams(
  params: URLSearchParams,
  pagination: Partial<ShopsManageListPagination>,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete('returnPage');
  next.delete('returnPageSize');

  const page = pagination.page ?? parseShopsManagePagination(next).page;
  const pageSize = pagination.pageSize ?? parseShopsManagePagination(next).pageSize;

  if (page <= DEFAULT_PAGE) next.delete('page');
  else next.set('page', String(page));

  if (pageSize === DEFAULT_PAGE_SIZE) next.delete('pageSize');
  else next.set('pageSize', String(pageSize));

  return next;
}

export function buildShopsManagePath(
  pagination?: Partial<ShopsManageListPagination>,
  baseParams?: URLSearchParams,
): string {
  const params = applyShopsManagePaginationToParams(
    new URLSearchParams(baseParams?.toString() ?? ''),
    pagination ?? {},
  );
  const query = params.toString();
  return query ? `/shops/manage?${query}` : '/shops/manage';
}

export function buildShopEditSearchParams(
  shopId: number,
  pagination: ShopsManageListPagination,
): URLSearchParams {
  const params = new URLSearchParams({
    id: String(shopId),
    returnPage: String(pagination.page),
    returnPageSize: String(pagination.pageSize),
  });
  return params;
}

export function buildShopsManagePathFromEdit(searchParams: URLSearchParams): string {
  return buildShopsManagePath(parseShopsManageReturnPagination(searchParams));
}
