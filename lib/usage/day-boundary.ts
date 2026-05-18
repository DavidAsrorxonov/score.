export interface UtcDayRange {
  start: Date;
  end: Date;
}

export function getUtcDayRange(now = new Date()): UtcDayRange {
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { end, start };
}

export function getNextUtcReset(now = new Date()): Date {
  return getUtcDayRange(now).end;
}
