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

/** "Today", "Tomorrow", or "Sat, Oct 18". */
export function formatDay(iso: string, now: Date) {
  const date = new Date(iso);
  const day = campusDayKey(date);

  if (day === campusDayKey(now)) return "Today";
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (day === campusDayKey(tomorrow)) return "Tomorrow";
  return dateFormat.format(date);
}

/** "Today, 2:00 PM", "Tomorrow, 11:00 AM", or "Sat, Oct 18, 3:00 PM". */
export function formatWhen(iso: string, now: Date) {
  return `${formatDay(iso, now)}, ${timeFormat.format(new Date(iso))}`;
}

const partsFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: CAMPUS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

/** Campus wall-clock time ("HH:MM") for a date. */
export function campusTimeOfDay(date: Date) {
  const p = Object.fromEntries(
    partsFormat.formatToParts(date).map((x) => [x.type, x.value]),
  );
  return `${p.hour.padStart(2, "0")}:${p.minute.padStart(2, "0")}`;
}

function campusOffsetMs(date: Date) {
  const p = Object.fromEntries(
    partsFormat.formatToParts(date).map((x) => [x.type, Number(x.value)]),
  );
  const wallClockAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return wallClockAsUtc - Math.floor(date.getTime() / 60000) * 60000;
}

/** "2026-10-17" + "14:00" on campus → a real instant, or null if invalid. */
export function campusDateTimeToDate(day: string, time: string) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) return null;

  const wallClockAsUtc = Date.UTC(+d[1], +d[2] - 1, +d[3], +t[1], +t[2]);
  let instant = wallClockAsUtc - campusOffsetMs(new Date(wallClockAsUtc));
  instant = wallClockAsUtc - campusOffsetMs(new Date(instant));
  const result = new Date(instant);
  if (Number.isNaN(result.getTime()) || campusDayKey(result) !== day) {
    return null;
  }
  return result;
}
