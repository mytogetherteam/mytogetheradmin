import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  activeUsersService,
  type ActorType,
} from '@/services/activeUsersService';

export const activeUsersKeys = {
  all: ['active-users'] as const,
  series: (from?: string, to?: string) =>
    [...activeUsersKeys.all, 'series', from ?? null, to ?? null] as const,
  summary: () => [...activeUsersKeys.all, 'summary'] as const,
  day: (date?: string, actorType?: ActorType) =>
    [...activeUsersKeys.all, 'day', date ?? null, actorType ?? null] as const,
};

/** Numbers only move once a day, so they are cached generously. */
const STALE_MS = 5 * 60_000;

export function useActiveUsersSeries(
  params: { from?: string; to?: string } = {},
  options: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: activeUsersKeys.series(params.from, params.to),
    queryFn: () => activeUsersService.series(params),
    enabled: options.enabled ?? true,
    staleTime: STALE_MS,
  });
}

export function useActiveUsersSummary(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: activeUsersKeys.summary(),
    queryFn: () => activeUsersService.summary(),
    enabled: options.enabled ?? true,
    staleTime: STALE_MS,
  });
}

/**
 * The day list, a page at a time — the panel asks for the next one when the
 * table is scrolled near its end, so a busy day never arrives all at once.
 */
export function useActiveUsersDay(
  params: { date?: string; actorType?: ActorType; size?: number } = {},
  options: { enabled?: boolean } = {},
) {
  return useInfiniteQuery({
    queryKey: activeUsersKeys.day(params.date, params.actorType),
    queryFn: ({ pageParam }) =>
      activeUsersService.day({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: options.enabled ?? true,
    staleTime: STALE_MS,
  });
}
