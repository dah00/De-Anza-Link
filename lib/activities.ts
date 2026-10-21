import type { SupabaseClient } from "@supabase/supabase-js";

export type Person = {
  id: string;
  displayName: string;
  photoUrl: string | null;
  major: string | null;
};

export type Activity = {
  id: string;
  title: string;
  description: string | null;
  interest: string;
  startsAt: string;
  location: string;
  address: string | null;
  minPeople: number;
  maxPeople: number;
  creatorId: string;
  going: Person[];
  joinedByMe: boolean;
};

export function spotsLeft(activity: Activity) {
  return Math.max(activity.maxPeople - activity.going.length, 0);
}

type ActivityRow = {
  id: string;
  title: string;
  description: string | null;
  interest: string;
  starts_at: string;
  location: string;
  address: string | null;
  min_people: number;
  max_people: number;
  creator_id: string;
  participations: {
    joined_at: string;
    profiles: {
      id: string;
      display_name: string | null;
      photo_url: string | null;
      major: string | null;
    } | null;
  }[];
};

const ACTIVITY_SELECT = `
  id, title, description, interest, starts_at, location, address, min_people, max_people, creator_id,
  participations (joined_at, profiles (id, display_name, photo_url, major))
`;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toActivity(row: ActivityRow, userId: string): Activity {
  const going = [...row.participations]
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
    .flatMap((p) =>
      p.profiles
        ? [
            {
              id: p.profiles.id,
              displayName: p.profiles.display_name ?? "Student",
              photoUrl: p.profiles.photo_url,
              major: p.profiles.major,
            },
          ]
        : [],
    );

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    interest: row.interest,
    startsAt: row.starts_at,
    location: row.location,
    address: row.address,
    minPeople: row.min_people,
    maxPeople: row.max_people,
    creatorId: row.creator_id,
    going,
    joinedByMe: going.some((p) => p.id === userId),
  };
}

/** Activities that haven't started yet, soonest first. */
export async function getUpcomingActivities(
  supabase: SupabaseClient,
  userId: string,
): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(200);

  if (error) throw error;
  return (data as unknown as ActivityRow[]).map((row) =>
    toActivity(row, userId),
  );
}

/** One activity by id, or null if it doesn't exist. */
export async function getActivity(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<Activity | null> {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await supabase
    .from("activities")
    .select(ACTIVITY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? toActivity(data as unknown as ActivityRow, userId) : null;
}
