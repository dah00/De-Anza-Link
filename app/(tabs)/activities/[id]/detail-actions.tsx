"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  deleteActivity,
  joinActivity,
  leaveActivity,
  type JoinResult,
} from "@/lib/activity-actions";

export function DetailActions({
  activityId,
  joined,
  hosting,
  full,
  started,
}: {
  activityId: string;
  joined: boolean;
  hosting: boolean;
  full: boolean;
  started: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (action: () => Promise<JoinResult>) =>
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (result?.error) setError(result.error);
    });

  let content: React.ReactNode;
  if (hosting) {
    content = (
      <>
        <p className="text-sm text-muted-foreground">
          You&apos;re hosting this one.
        </p>
        <Button
          variant="destructive"
          size="lg"
          className="h-10"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this activity for everyone?")) {
              run(() => deleteActivity(activityId));
            }
          }}
        >
          {pending ? "Deleting..." : "Delete"}
        </Button>
      </>
    );
  } else if (joined) {
    content = (
      <>
        <p className="text-sm font-medium text-primary">You&apos;re going</p>
        {!started && (
          <Button
            variant="outline"
            size="lg"
            className="h-10"
            disabled={pending}
            onClick={() => run(() => leaveActivity(activityId))}
          >
            {pending ? "Leaving..." : "Can't make it"}
          </Button>
        )}
      </>
    );
  } else if (started) {
    content = (
      <p className="text-sm text-muted-foreground">This one already started.</p>
    );
  } else {
    content = (
      <Button
        size="lg"
        className="h-11 w-full text-base"
        disabled={pending || full}
        onClick={() => run(() => joinActivity(activityId))}
      >
        {full ? "Full" : pending ? "Joining..." : "I'm down"}
      </Button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">{content}</div>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
