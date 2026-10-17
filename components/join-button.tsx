"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { joinActivity } from "@/lib/activity-actions";

export function JoinButton({
  activityId,
  full,
}: {
  activityId: string;
  full: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (full) {
    return (
      <Button variant="outline" size="lg" className="h-9" disabled>
        Full
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="lg"
        className="h-9 px-4"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await joinActivity(activityId);
            if (result?.error) setError(result.error);
          })
        }
      >
        {pending ? "Joining..." : "I'm down"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
