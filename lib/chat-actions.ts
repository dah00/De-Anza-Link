"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SendResult = { error: string } | undefined;

const MAX_LENGTH = 1000;

export async function sendMessage(
  activityId: string,
  text: string,
): Promise<SendResult> {
  const body = text.trim();
  if (!body) return { error: "Type a message first." };
  if (body.length > MAX_LENGTH) {
    return { error: `Keep it under ${MAX_LENGTH} characters.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in first." };

  const { error } = await supabase
    .from("messages")
    .insert({ activity_id: activityId, user_id: user.id, body });

  if (error) {
    // 23503: no chat row yet (not enough people). 42501: RLS, not going.
    if (error.code === "23503") return { error: "The chat isn't open yet." };
    if (error.code === "42501") {
      return { error: "Only people going can post here." };
    }
    return { error: "Couldn't send. Try again." };
  }

  refresh();
}

/** Called by the chat screen while it's open. Refresh clears the unread dot. */
export async function markChatRead(activityId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_chat_read", {
    chat_id: activityId,
  });
  if (!error) refresh();
}
