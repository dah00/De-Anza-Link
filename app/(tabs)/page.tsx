import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle, Plus } from "lucide-react";
import { ActivityCard } from "@/components/activity-card";
import { AvatarStack, goingNames } from "@/components/avatar-stack";
import { Avatar } from "@/components/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  getUpcomingActivities,
  spotsLeft,
  type Activity,
} from "@/lib/activities";
import { createClient } from "@/lib/supabase/server";
import { formatWhen, isCampusToday } from "@/lib/time";
import { cn } from "@/lib/utils";
import { logOut } from "../(auth)/actions";

const FOR_YOU_LIMIT = 4;

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, activities] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, photo_url, interests")
      .eq("id", user.id)
      .single(),
    getUpcomingActivities(supabase, user.id),
  ]);

  const now = new Date();
  const name = profile?.display_name ?? "there";
  const interests: string[] = profile?.interests ?? [];

  const upcoming = activities.filter((a) => a.joinedByMe);
  const notJoined = activities.filter((a) => !a.joinedByMe);
  const byUrgency = (a: Activity, b: Activity) =>
    spotsLeft(a) - spotsLeft(b) || a.startsAt.localeCompare(b.startsAt);

  const matching = notJoined
    .filter((a) => interests.includes(a.interest) && spotsLeft(a) > 0)
    .sort(byUrgency)
    .slice(0, FOR_YOU_LIMIT);
  const forYouIsFallback = matching.length === 0;
  const forYou = forYouIsFallback
    ? notJoined
        .filter((a) => spotsLeft(a) > 0)
        .sort(byUrgency)
        .slice(0, FOR_YOU_LIMIT)
    : matching;

  const forYouIds = new Set(forYou.map((a) => a.id));
  const today = notJoined.filter(
    (a) => isCampusToday(a.startsAt, now) && !forYouIds.has(a.id),
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">DeAnza Link</p>
          <h1 className="text-2xl font-semibold">Hey, {name.split(" ")[0]}</h1>
        </div>
        <Link href="/account" aria-label="Your account">
          <Avatar
            name={name}
            photoUrl={profile?.photo_url ?? null}
            className="size-10"
          />
        </Link>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/activities/new"
          className={cn(buttonVariants({ size: "lg" }), "h-11")}
        >
          <Plus />
          Start an activity
        </Link>
        <Link
          href="/resources"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11",
          )}
        >
          <MessageCircle />
          Ask about De Anza
        </Link>
      </div>

      <Section title="Your upcoming">
        {upcoming.length === 0 ? (
          <EmptyNote>
            Nothing yet. Tap &ldquo;I&apos;m down&rdquo; on something below and
            it&apos;ll show up here.
          </EmptyNote>
        ) : (
          upcoming.map((activity) => (
            <UpcomingRow
              key={activity.id}
              activity={activity}
              myId={user.id}
              now={now}
            />
          ))
        )}
      </Section>

      <Section
        title="For you"
        hint={
          forYouIsFallback
            ? "Nothing open matches your interests right now, so here's what's filling up."
            : "Matches your interests. Almost-full ones first."
        }
      >
        {forYou.length === 0 ? (
          <EmptyNote>
            No open activities yet.{" "}
            <Link
              href="/activities/new"
              className="font-medium text-primary underline"
            >
              Start one
            </Link>
            .
          </EmptyNote>
        ) : (
          forYou.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              myId={user.id}
              now={now}
            />
          ))
        )}
      </Section>

      <Section title="Happening today" hint="Anything on campus today.">
        {today.length === 0 ? (
          <EmptyNote>Nothing else on campus today.</EmptyNote>
        ) : (
          today.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              myId={user.id}
              now={now}
            />
          ))
        )}
      </Section>

      <form action={logOut}>
        <button
          type="submit"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Log out
        </button>
      </form>
    </div>
  );
}

function UpcomingRow({
  activity,
  myId,
  now,
}: {
  activity: Activity;
  myId: string;
  now: Date;
}) {
  return (
    <Link
      href={`/activities/${activity.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">
          {formatWhen(activity.startsAt, now)}
        </p>
        <p className="mt-0.5 truncate font-semibold">{activity.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {activity.location} &middot; {goingNames(activity.going, myId)}
        </p>
      </div>
      <AvatarStack people={activity.going} max={3} />
    </Link>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      {children}
    </p>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="h-14 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 animate-pulse rounded-lg bg-muted" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
