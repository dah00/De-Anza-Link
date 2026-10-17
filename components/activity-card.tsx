import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { spotsLeft, type Activity } from "@/lib/activities";
import { formatWhen } from "@/lib/time";
import { AvatarStack, goingNames } from "./avatar-stack";
import { JoinButton } from "./join-button";

export function ActivityCard({
  activity,
  myId,
  now,
  showJoin = true,
}: {
  activity: Activity;
  myId: string;
  now: Date;
  showJoin?: boolean;
}) {
  const left = spotsLeft(activity);

  return (
    <article className="relative rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-primary">{activity.interest}</span>
        {!activity.joinedByMe && left > 0 && left <= 2 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            {left === 1 ? "1 spot left" : "2 spots left"}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 leading-snug font-semibold">
        <Link
          href={`/activities/${activity.id}`}
          className="after:absolute after:inset-0 after:rounded-xl"
        >
          {activity.title}
        </Link>
      </h3>

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {formatWhen(activity.startsAt, now)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          {activity.location}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AvatarStack people={activity.going} />
          <div className="min-w-0 text-xs leading-tight">
            <p className="font-medium">
              {activity.going.length}/{activity.maxPeople} going
            </p>
            <p className="truncate text-muted-foreground">
              {goingNames(activity.going, myId)}
            </p>
          </div>
        </div>
        {showJoin && !activity.joinedByMe && (
          <div className="relative z-10 shrink-0">
            <JoinButton activityId={activity.id} full={left === 0} />
          </div>
        )}
      </div>
    </article>
  );
}
