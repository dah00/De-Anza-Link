import type { EventStatus, NavigatorEvent } from "@/lib/navigator/types";

export function getEventStatus(
  event: NavigatorEvent,
  now = new Date(),
): EventStatus | null {
  if (!event.start || !event.end) return null;

  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  const current = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  if (current < start) return "upcoming";
  if (current > end) return "ended";
  return "in progress";
}
