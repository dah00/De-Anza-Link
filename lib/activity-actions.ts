"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type JoinResult = { error: string } | undefined;

export async function joinActivity(activityId: string): Promise<JoinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in first." };

  const { error } = await supabase
    .from("participations")
    .insert({ activity_id: activityId, user_id: user.id });

  if (error) {
    if (error.message.includes("activity_full")) {
      return { error: "Just filled up. Try another one." };
    }
    if (error.message.includes("activity_started")) {
      return { error: "This one already started." };
    }
    if (error.code !== "23505") {
      return { error: "Couldn't join. Try again." };
    }
  }

  refresh();
}

export async function leaveActivity(activityId: string): Promise<JoinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in first." };

  const { error } = await supabase
    .from("participations")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", user.id);

  if (error) return { error: "Couldn't leave. Try again." };

  refresh();
}
