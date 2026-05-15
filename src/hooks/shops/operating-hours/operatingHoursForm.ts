import type { OperatingHour } from '@/services/shopService';
import type { OperatingHoursFormValues } from '@/schemas/operatingHours.schema';

export function defaultOperatingWeek(): OperatingHoursFormValues['operatingHours'] {
  return [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '21:00', isClosed: false },
  ];
}

function normalizeDayOfWeek(dayOfWeek: number): number {
  return dayOfWeek === 7 ? 0 : dayOfWeek;
}

function toTimeInput(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  return value.slice(0, 5);
}

export function mapApiOperatingHoursToForm(
  rows: OperatingHour[] | undefined,
): OperatingHoursFormValues['operatingHours'] {
  const defaults = defaultOperatingWeek();
  if (!rows?.length) return defaults;

  return defaults.map((slot) => {
    const match = rows.find(
      (row) => normalizeDayOfWeek(row.dayOfWeek) === slot.dayOfWeek,
    );
    if (!match) return slot;

    return {
      dayOfWeek: slot.dayOfWeek,
      openTime: toTimeInput(match.openTime, slot.openTime),
      closeTime: toTimeInput(match.closeTime, slot.closeTime),
      isClosed: match.isClosed ?? false,
    };
  });
}

export function buildOperatingHoursUpdateFormData(
  operatingHours: OperatingHoursFormValues['operatingHours'],
): FormData {
  const fd = new FormData();
  fd.append('operatingHours', JSON.stringify(operatingHours));
  return fd;
}
