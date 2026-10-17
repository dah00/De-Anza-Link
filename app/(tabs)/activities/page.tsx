import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { ActivityCard } from "@/components/activity-card";
import { buttonVariants } from "@/components/ui/button";
import { getUpcomingActivities, type Activity } from "@/lib/activities";
import { createClient } from "@/lib/supabase/server";
import { campusDayKey, formatDay } from "@/lib/time";
import { INTERESTS } from "@/lib/interests";
import { cn } from "@/lib/utils";
import { SearchBox } from "./search-box";

const MINE = "mine";

export default function ActivitiesPage({
  searchParams,
}: PageProps<"/activities">) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Activities</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/activities/upcoming"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-9 border-primary bg-primary/10 hover:bg-primary/15",
            )}
          >
            Upcoming
          </Link>
          <Link
            href="/activities/new"
            className={cn(buttonVariants({ size: "lg" }), "h-9")}
          >
            <Plus />
            New
          </Link>
        </div>
      </header>
      <Suspense fallback={<ListSkeleton />}>
        <ActivityList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ActivityList({
  searchParams,
}: {
  searchParams: PageProps<"/activities">["searchParams"];
}) {
  const { interest, q } = await searchParams;
  const filter = typeof interest === "string" ? interest : null;
  const query = typeof q === "string" ? q.trim() : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, activities] = await Promise.all([
    supabase.from("profiles").select("interests").eq("id", user.id).single(),
    getUpcomingActivities(supabase, user.id),
  ]);
  const myInterests: string[] = profile?.interests ?? [];

  const counts = new Map<string, number>();
  for (const a of activities) {
    counts.set(a.interest, (counts.get(a.interest) ?? 0) + 1);
  }
  const chipInterests = [...counts.keys()].sort(
    (a, b) =>
      Number(myInterests.includes(b)) - Number(myInterests.includes(a)) ||
      counts.get(b)! - counts.get(a)! ||
      a.localeCompare(b),
  );
  if (filter && filter !== MINE && !counts.has(filter)) {
    chipInterests.unshift(filter);
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = activities.filter((a) => {
    if (filter === MINE && !myInterests.includes(a.interest)) return false;
    if (filter && filter !== MINE && a.interest !== filter) return false;
    const haystack = [a.title, a.interest, a.location, a.address, a.description]
      .join(" ")
      .toLowerCase();
    return words.every((word) => haystack.includes(word));
  });

  const emptyInterest =
    filter && filter !== MINE
      ? filter
      : query
        ? INTERESTS.find((i) => i.toLowerCase().includes(query.toLowerCase()))
        : undefined;

  const now = new Date();
  const days = groupByDay(shown);

  return (
    <>
      <SearchBox initial={query} />

      <nav
        aria-label="Filter by interest"
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1"
      >
        <Chip href="/activities" active={!filter && !query}>
          All
        </Chip>
        {myInterests.length > 0 && (
          <Chip href={`/activities?interest=${MINE}`} active={filter === MINE}>
            Your interests
          </Chip>
        )}
        {chipInterests.map((name) => (
          <Chip
            key={name}
            href={`/activities?interest=${encodeURIComponent(name)}`}
            active={filter === name}
          >
            {name}
          </Chip>
        ))}
      </nav>

      {days.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          <p>
            {query
              ? `Nothing matches “${query}” yet.`
              : filter && filter !== MINE
                ? `Nothing in ${filter} yet.`
                : "Nothing coming up here yet."}
          </p>
          <Link
            href={
              emptyInterest
                ? `/activities/new?interest=${encodeURIComponent(emptyInterest)}`
                : "/activities/new"
            }
            className="mt-2 inline-block font-medium text-primary underline underline-offset-4"
          >
            Start one
          </Link>
        </div>
      ) : (
        days.map(({ key, items }) => (
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
        ))
      )}
    </>
  );
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

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {children}
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <div className="h-8 animate-pulse rounded-full bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
