import type { EventStatus, NavigatorEvent } from "@/lib/navigator/types";

export function getEventStatus(
  event: NavigatorEvent,
  now = new Date(),
): EventStatus {
  if (!event.start || !event.end) return "unknown";

  const start = new Date(event.start).getTime();
  const end = new Date(event.end).getTime();
  const current = now.getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return "unknown";
  }
  if (current < start) return "upcoming";
  if (current <= end) return "in_progress";
  return "ended";
}
