import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getMyChats } from "@/lib/chat";
import { createClient } from "@/lib/supabase/server";
import { formatWhen } from "@/lib/time";
import { cn } from "@/lib/utils";

export default function ChatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Chats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One group chat per activity you&apos;re going to.
        </p>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <ChatList />
      </Suspense>
    </div>
  );
}

async function ChatList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const chats = await getMyChats(supabase);
  const now = new Date();

  if (chats.length === 0) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-dashed p-4">
        <p className="text-sm text-muted-foreground">
          No chats yet. A group chat opens once enough people are going to an
          activity.
        </p>
        <Link
          href="/activities"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-10 self-start",
          )}
        >
          Find an activity
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {chats.map((chat) => {
        const sender =
          chat.lastUserId === user.id ? "You" : (chat.lastName ?? "Student");
        return (
          <li key={chat.activityId}>
            <Link
              href={`/chats/${chat.activityId}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate",
                    chat.unread ? "font-semibold" : "font-medium",
                  )}
                >
                  {chat.title}
                </p>
                <p
                  className={cn(
                    "truncate text-sm",
                    chat.unread ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {chat.lastBody
                    ? `${sender}: ${chat.lastBody}`
                    : "No messages yet. Say hi."}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatWhen(chat.startsAt, now)}
                </p>
              </div>
              {chat.unread && (
                <span className="size-2.5 shrink-0 rounded-full bg-primary">
                  <span className="sr-only">New messages</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
