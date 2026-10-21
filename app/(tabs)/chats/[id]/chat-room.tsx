"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markChatRead, sendMessage } from "@/lib/chat-actions";
import { cn } from "@/lib/utils";

export type ChatLine = {
  id: string;
  body: string;
  mine: boolean;
  name: string;
  photoUrl: string | null;
  when: string;
  showMeta: boolean;
};

export function ChatRoom({
  activityId,
  lines,
}: {
  activityId: string;
  lines: ChatLine[];
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // New messages arrive through ChatUpdates in the tabs layout, which refreshes this page.
  // Mark read on open and whenever a new message shows up while it's open.
  const lastId = lines.at(-1)?.id;
  useEffect(() => {
    markChatRead(activityId);
  }, [activityId, lastId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || pending) return;
    startTransition(async () => {
      setError(null);
      const result = await sendMessage(activityId, text);
      if (result?.error) setError(result.error);
      else setText("");
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      {lines.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          No messages yet. Say hi and figure out how you&apos;ll find each
          other.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {lines.map((line) => (
            <li
              key={line.id}
              className={cn(
                "flex flex-col",
                line.mine ? "items-end" : "items-start",
                line.showMeta && "mt-3",
              )}
            >
              {line.showMeta && (
                <p className="mb-1 text-xs text-muted-foreground">
                  {line.mine ? "You" : line.name} &middot; {line.when}
                </p>
              )}
              <div className="flex max-w-[85%] items-end gap-2">
                {!line.mine &&
                  (line.showMeta ? (
                    <Avatar
                      name={line.name}
                      photoUrl={line.photoUrl}
                      className="size-7"
                    />
                  ) : (
                    <span className="w-7 shrink-0" />
                  ))}
                <p
                  className={cn(
                    "rounded-2xl px-3 py-2 text-[15px] break-words whitespace-pre-line",
                    line.mine
                      ? "bg-primary text-primary-foreground"
                      : "border bg-card",
                  )}
                >
                  {line.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div ref={endRef} />

      <form
        onSubmit={submit}
        className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 mt-auto bg-background px-4 pt-4 pb-2"
      >
        <div className="flex gap-2">
          <Input
            value={text}
            onChange={(e) => {
              setError(null);
              setText(e.target.value);
            }}
            placeholder="Message the group"
            aria-label="Message"
            maxLength={1000}
            className="h-10"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="size-10"
            disabled={pending || !text.trim()}
            aria-label="Send"
          >
            <SendHorizontal />
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </form>
    </div>
  );
}
