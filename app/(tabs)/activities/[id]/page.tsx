import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, MapPin, MessageSquare, Users } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { buttonVariants } from "@/components/ui/button";
import { getActivity, spotsLeft } from "@/lib/activities";
import { isChatOpen } from "@/lib/chat";
import { mapLinks } from "@/lib/maps";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";
import { DetailActions } from "./detail-actions";

export default function ActivityPage({
  params,
}: PageProps<"/activities/[id]">) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Activities
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <ActivityDetail params={params} />
      </Suspense>
    </div>
  );
}

async function ActivityDetail({
  params,
}: {
  params: PageProps<"/activities/[id]">["params"];
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const activity = await getActivity(supabase, id, user.id);
  if (!activity) notFound();

  const now = new Date();
  const left = spotsLeft(activity);
  const started = new Date(activity.startsAt).getTime() < now.getTime();
  const hosting = activity.creatorId === user.id;
  const maps = mapLinks(activity.location, activity.address);
  const needed = activity.minPeople - activity.going.length;
  const chatOpen =
    activity.joinedByMe && (await isChatOpen(supabase, activity.id));

  return (
    <>
      <div>
        <p className="text-sm font-medium text-primary">{activity.interest}</p>
        <h1 className="mt-1 text-2xl leading-tight font-semibold">
          {activity.title}
        </h1>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <span className="inline-flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            {formatWhen(activity.startsAt, now)}
          </span>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p>
                {activity.location}
                {!activity.address && (
                  <span className="text-muted-foreground">
                    {" "}
                    &middot; De Anza campus
                  </span>
                )}
              </p>
              {activity.address && (
                <p className="text-muted-foreground">{activity.address}</p>
              )}
              <p className="mt-0.5 flex gap-4">
                <a
                  href={maps.google}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Google Maps
                </a>
                <a
                  href={maps.apple}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Apple Maps
                </a>
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            {activity.going.length}/{activity.maxPeople} going
            {!started && needed > 0 && (
              <span className="font-medium text-primary">
                &middot; needs {needed} more
              </span>
            )}
            {!started && needed <= 0 && left > 0 && left <= 2 && (
              <span className="font-medium text-primary">
                &middot; {left === 1 ? "1 spot left" : "2 spots left"}
              </span>
            )}
          </span>
        </div>
        {activity.description && (
          <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line">
            {activity.description}
          </p>
        )}
      </div>

      <DetailActions
        activityId={activity.id}
        joined={activity.joinedByMe}
        hosting={hosting}
        full={left === 0}
        started={started}
      />

      {activity.joinedByMe &&
        (chatOpen ? (
          <Link
            href={`/chats/${activity.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "-mt-2 h-10",
            )}
          >
            <MessageSquare />
            Group chat
          </Link>
        ) : (
          <p className="-mt-2 text-sm text-muted-foreground">
            The group chat opens when {activity.minPeople} people are going.
          </p>
        ))}

      <section>
        <h2 className="text-lg font-semibold">Who&apos;s going</h2>
        {activity.going.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No one yet. Be the first.
          </p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {activity.going.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar
                  name={person.displayName}
                  photoUrl={person.photoUrl}
                  className="size-10"
                />
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {person.id === user.id ? "You" : person.displayName}
                    {person.id === activity.creatorId && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Host
                      </span>
                    )}
                  </p>
                  {person.major && (
                    <p className="truncate text-sm text-muted-foreground">
                      {person.major}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-11 animate-pulse rounded-lg bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
