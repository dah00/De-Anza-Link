"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isInterest } from "@/lib/interests";
import { isCampusLocation } from "@/lib/locations";
import { createClient } from "@/lib/supabase/server";
import { campusDateTimeToDate } from "@/lib/time";

export type JoinResult = { error: string } | undefined;

export type NewActivity = {
  title: string;
  description: string;
  interest: string;
  day: string;
  time: string;
  offCampus: boolean;
  location: string;
  address: string;
  minPeople: number;
  maxPeople: number;
};

const MAX_DAYS_AHEAD = 60;

export async function createActivity(input: NewActivity): Promise<JoinResult> {
  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const address = input.offCampus ? input.address.trim() : "";
  const startsAt = campusDateTimeToDate(input.day, input.time);

  if (!title) return { error: "Give it a name." };
  if (title.length > 80) return { error: "Keep the name under 80 characters." };
  if (description.length > 500) {
    return { error: "Keep the details under 500 characters." };
  }
  if (!isInterest(input.interest)) return { error: "Pick what it's about." };
  if (input.offCampus) {
    if (!location) return { error: "Name the place, like a park or café." };
    if (location.length > 80) {
      return { error: "Keep the place name under 80 characters." };
    }
    if (address.length < 5)
      return { error: "Add the address so people can find it." };
    if (address.length > 200) {
      return { error: "Keep the address under 200 characters." };
    }
  } else if (!isCampusLocation(location)) {
    return { error: "Pick a spot on campus." };
  }
  if (
    !Number.isInteger(input.maxPeople) ||
    input.maxPeople < 2 ||
    input.maxPeople > 20
  ) {
    return { error: "Max people should be between 2 and 20." };
  }
  if (
    !Number.isInteger(input.minPeople) ||
    input.minPeople < 2 ||
    input.minPeople > input.maxPeople
  ) {
    return { error: "Min people should be between 2 and max people." };
  }
  if (!startsAt) return { error: "Pick a day and time." };
  if (startsAt.getTime() < Date.now()) {
    return { error: "That time already passed." };
  }
  if (startsAt.getTime() > Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
    return { error: `Pick a time in the next ${MAX_DAYS_AHEAD} days.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activity, error } = await supabase
    .from("activities")
    .insert({
      title,
      description: description || null,
      interest: input.interest,
      starts_at: startsAt.toISOString(),
      location,
      address: address || null,
      min_people: input.minPeople,
      max_people: input.maxPeople,
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (error || !activity) return { error: "Couldn't create it. Try again." };

  await supabase
    .from("participations")
    .insert({ activity_id: activity.id, user_id: user.id });

  redirect(`/activities/${activity.id}`);
}

export async function deleteActivity(activityId: string): Promise<JoinResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in first." };

  const { error, count } = await supabase
    .from("activities")
    .delete({ count: "exact" })
    .eq("id", activityId)
    .eq("creator_id", user.id);

  if (error || count === 0) return { error: "Couldn't delete it. Try again." };

  redirect("/activities");
}

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
