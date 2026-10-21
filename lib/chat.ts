import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  userId: string;
  displayName: string;
  photoUrl: string | null;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null; photo_url: string | null } | null;
};

const MESSAGE_LIMIT = 200;

/** True once enough people are going (the DB trigger opens the chat). */
export async function isChatOpen(
  supabase: SupabaseClient,
  activityId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("activity_chats")
    .select("activity_id")
    .eq("activity_id", activityId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/** The latest messages, oldest first. RLS returns nothing unless the user is going. */
export async function getMessages(
  supabase: SupabaseClient,
  activityId: string,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, body, created_at, user_id, profiles (display_name, photo_url)")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_LIMIT);

  if (error) throw error;
  return (data as unknown as MessageRow[]).reverse().map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? "Student",
    photoUrl: row.profiles?.photo_url ?? null,
  }));
}

export type ChatSummary = {
  activityId: string;
  title: string;
  startsAt: string;
  lastBody: string | null;
  lastAt: string;
  lastUserId: string | null;
  lastName: string | null;
  unread: boolean;
};

type ChatSummaryRow = {
  activity_id: string;
  title: string;
  starts_at: string;
  last_body: string | null;
  last_at: string;
  last_user_id: string | null;
  last_name: string | null;
  unread: boolean;
};

/** The signed-in user's open chats, latest message first. */
export async function getMyChats(
  supabase: SupabaseClient,
): Promise<ChatSummary[]> {
  const { data, error } = await supabase.rpc("my_chats");

  if (error) throw error;
  return (data as ChatSummaryRow[]).map((row) => ({
    activityId: row.activity_id,
    title: row.title,
    startsAt: row.starts_at,
    lastBody: row.last_body,
    lastAt: row.last_at,
    lastUserId: row.last_user_id,
    lastName: row.last_name,
    unread: row.unread,
  }));
}

/** For the dot on the Chats tab. False on any error, so the nav never breaks. */
export async function hasUnreadChats(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc("my_chats")
    .select("activity_id")
    .eq("unread", true)
    .limit(1);

  return !error && Array.isArray(data) && data.length > 0;
}
