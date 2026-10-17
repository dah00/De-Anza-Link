export const CAMPUS_TIME_ZONE = "America/Los_Angeles";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: CAMPUS_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** "2026-10-17" in campus time, for comparing calendar days. */
export function campusDayKey(date: Date) {
  return dayKeyFormat.format(date);
}

export function isCampusToday(iso: string, now: Date) {
  return campusDayKey(new Date(iso)) === campusDayKey(now);
}

/** "Today, 2:00 PM", "Tomorrow, 11:00 AM", or "Sat, Oct 18, 3:00 PM". */
export function formatWhen(iso: string, now: Date) {
  const date = new Date(iso);
  const time = timeFormat.format(date);
  const day = campusDayKey(date);

  if (day === campusDayKey(now)) return `Today, ${time}`;
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (day === campusDayKey(tomorrow)) return `Tomorrow, ${time}`;
  return `${dateFormat.format(date)}, ${time}`;
}
