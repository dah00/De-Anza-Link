"use server";

import { redirect } from "next/navigation";
import { isInterest } from "@/lib/interests";
import { createClient } from "@/lib/supabase/server";

export type OnboardingData = {
  interests: string[];
  photoUrl: string | null;
  displayName: string;
  major: string;
  bio: string;
};

export async function completeOnboarding(
  data: OnboardingData,
): Promise<{ error: string } | undefined> {
  const interests = data.interests.filter(isInterest);
  const displayName = data.displayName.trim();
  const major = data.major.trim();
  const bio = data.bio.trim();

  if (interests.length === 0) return { error: "Pick at least one interest." };
  if (!displayName) return { error: "Add the name people should see." };
  if (displayName.length > 40)
    return { error: "Keep your name under 40 characters." };
  if (major.length > 60)
    return { error: "Keep your major under 60 characters." };
  if (bio.length > 160) return { error: "Keep your bio under 160 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({
      interests,
      photo_url: data.photoUrl,
      display_name: displayName,
      major: major || null,
      bio: bio || null,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) return { error: "Couldn't save your profile. Try again." };

  redirect("/");
}
