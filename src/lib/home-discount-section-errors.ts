import { ApiError } from '@/services/apiClient';
import { getHumanMessageFromNestHttpBody } from '@/lib/nestHttpBody';

export type ScheduleOverlapErrorBody = {
  code?: string;
  message?: string;
  conflictingSection?: {
    id: number;
    title: string | null;
    discountPercent: number;
    startTime: string | null;
    endTime: string | null;
    scheduleLabel?: string;
  };
};

export function isScheduleOverlapError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 400) {
    return false;
  }
  const body = error.data as ScheduleOverlapErrorBody | undefined;
  if (body?.code === 'SCHEDULE_OVERLAP') {
    return true;
  }
  const message = getHumanMessageFromNestHttpBody(body).toLowerCase();
  return message.includes('overlap') || message.includes('schedule overlap');
}

export function getScheduleOverlapMessage(error: unknown): string | null {
  if (!isScheduleOverlapError(error)) {
    return null;
  }

  const body = (error as ApiError).data as ScheduleOverlapErrorBody | undefined;
  const base =
    getHumanMessageFromNestHttpBody(body).trim() ||
    'This schedule overlaps with another home discount section.';

  const conflict = body?.conflictingSection;
  if (!conflict) {
    return base;
  }

  const title = conflict.title?.trim() || 'MyTogether {} Off (default)';
  const schedule = conflict.scheduleLabel || 'overlapping period';

  return `${base}\n\nConflicting section: #${conflict.id} — ${title} (${conflict.discountPercent}%)\nSchedule: ${schedule}`;
}
