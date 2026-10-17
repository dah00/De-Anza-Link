import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ActivityCard } from "@/components/activity-card";
import { getUpcomingActivities, type Activity } from "@/lib/activities";
import { createClient } from "@/lib/supabase/server";
import { campusDayKey, formatDay } from "@/lib/time";

export default function UpcomingActivitiesPage() {
  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Activities
      </Link>
      <header>
        <h1 className="text-2xl font-semibold">Your upcoming</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you&apos;re going to, soonest first.
        </p>
      </header>
      <Suspense fallback={<UpcomingSkeleton />}>
        <UpcomingList />
      </Suspense>
    </div>
  );
}

async function UpcomingList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activities = await getUpcomingActivities(supabase, user.id);
  const upcoming = activities.filter((a) => a.joinedByMe);
  const now = new Date();
  const days = groupByDay(upcoming);

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        <p>Nothing on your list yet.</p>
        <Link
          href="/activities"
          className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
        >
          Browse activities
        </Link>
      </div>
    );
  }

  return days.map(({ key, items }) => (
    <section key={key}>
      <h2 className="text-sm font-semibold text-muted-foreground">
        {formatDay(items[0].startsAt, now)}
      </h2>
      <div className="mt-2 flex flex-col gap-3">
        {items.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            myId={user.id}
            now={now}
          />
        ))}
      </div>
    </section>
  ));
}

function groupByDay(activities: Activity[]) {
  const days: { key: string; items: Activity[] }[] = [];
  for (const activity of activities) {
    const key = campusDayKey(new Date(activity.startsAt));
    const last = days.at(-1);
    if (last?.key === key) last.items.push(activity);
    else days.push({ key, items: [activity] });
  }
  return days;
}

function UpcomingSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
