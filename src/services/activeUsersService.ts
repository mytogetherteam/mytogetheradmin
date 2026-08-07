import { config } from '@/config/config';
import { handleApiCall } from '@/lib/handleApiCall';
import { api } from '@/utils/axios';

/** One day's distinct people, split by role. Empty days come back as zeros. */
export interface ActiveUsersPoint {
  date: string;
  adminTotal: number;
  shopAdmin: number;
  operationAdmin: number;
  superAdmin: number;
  customers: number;
}

export interface ActiveUsersSeries {
  from: string;
  to: string;
  series: ActiveUsersPoint[];
}

export interface ActiveUsersCounts {
  admins: number;
  shopAdmin: number;
  operationAdmin: number;
  superAdmin: number;
  customers: number;
}

export interface ActiveUsersSummary {
  today: ActiveUsersCounts;
  yesterday: ActiveUsersCounts;
  /** Distinct people over the window — someone on five days counts once. */
  last7Days: { admins: number; customers: number };
  last30Days: { admins: number; customers: number };
  /** Accounts that exist, so a count can be read as a share. */
  registered: ActiveUsersCounts;
}

export type ActorType = 'ADMIN' | 'USER';

export interface ActiveActor {
  actorId: number;
  actorType: ActorType;
  role: string | null;
  name: string | null;
  contact: string | null;
  shopId: number | null;
  shopName: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  hits: number;
}

export interface ActiveActorsDay {
  date: string;
  actorType: ActorType;
  total: number;
  actors: ActiveActor[];
}

export const activeUsersService = {
  series: (params?: { from?: string; to?: string }): Promise<ActiveUsersSeries> => {
    const query = new URLSearchParams();
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    const qs = query.toString();
    const url = qs
      ? `${config.endpoints.admin.analytics.activeUsers}?${qs}`
      : config.endpoints.admin.analytics.activeUsers;
    return handleApiCall<ActiveUsersSeries>(() => api.get(url));
  },

  summary: (): Promise<ActiveUsersSummary> =>
    handleApiCall<ActiveUsersSummary>(() =>
      api.get(config.endpoints.admin.analytics.activeUsersSummary),
    ),

  day: (params?: { date?: string; actorType?: ActorType }): Promise<ActiveActorsDay> => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.actorType) query.append('actorType', params.actorType);
    const qs = query.toString();
    const url = qs
      ? `${config.endpoints.admin.analytics.activeUsersDay}?${qs}`
      : config.endpoints.admin.analytics.activeUsersDay;
    return handleApiCall<ActiveActorsDay>(() => api.get(url));
  },
};
