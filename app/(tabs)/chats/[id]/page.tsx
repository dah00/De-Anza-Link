import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getActivity } from "@/lib/activities";
import { getMessages, isChatOpen } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";
import { ChatRoom, type ChatLine } from "./chat-room";

// A new name/time header shows when the sender changes or after a pause this long.
const GAP_MS = 15 * 60 * 1000;

export default function ChatPage({
  params,
}: PageProps<"/chats/[id]">) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <Chat params={params} />
    </Suspense>
  );
}

async function Chat({
  params,
}: {
  params: PageProps<"/chats/[id]">["params"];
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
  const header = (
    <div className="flex flex-col gap-4">
      <Link
        href="/chats"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Chats
      </Link>
      <div>
        <h1 className="text-xl leading-tight font-semibold">
          {activity.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatWhen(activity.startsAt, now)} &middot; {activity.location}
          {" · "}
          <Link
            href={`/activities/${activity.id}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Details
          </Link>
        </p>
      </div>
    </div>
  );

  if (!activity.joinedByMe) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Only people going can see the group chat.
        </p>
      </div>
    );
  }

  if (!(await isChatOpen(supabase, activity.id))) {
    const more = activity.minPeople - activity.going.length;
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          The group chat opens when {activity.minPeople} people are going.{" "}
          {more === 1 ? "1 more to go." : `${more} more to go.`}
        </p>
      </div>
    );
  }

  const messages = await getMessages(supabase, activity.id);
  const lines: ChatLine[] = messages.map((m, i) => {
    const prev = messages[i - 1];
    return {
      id: m.id,
      body: m.body,
      mine: m.userId === user.id,
      name: m.displayName,
      photoUrl: m.photoUrl,
      when: formatWhen(m.createdAt, now),
      showMeta:
        !prev ||
        prev.userId !== m.userId ||
        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() >
          GAP_MS,
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      {header}
      <ChatRoom activityId={activity.id} lines={lines} />
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="h-16 animate-pulse rounded-lg bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
