"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isInterest } from "@/lib/interests";
import { createClient } from "@/lib/supabase/server";

export type ProfileData = {
  displayName: string;
  major: string;
  bio: string;
  interests: string[];
};

export async function updateProfile(
  data: ProfileData,
): Promise<{ error: string } | undefined> {
  const interests = data.interests.filter(isInterest);
  const displayName = data.displayName.trim();
  const major = data.major.trim();
  const bio = data.bio.trim();

  if (!displayName) return { error: "Add the name people should see." };
  if (displayName.length > 40) {
    return { error: "Keep your name under 40 characters." };
  }
  if (major.length > 60)
    return { error: "Keep your major under 60 characters." };
  if (bio.length > 160) return { error: "Keep your bio under 160 characters." };
  if (interests.length === 0) return { error: "Pick at least one interest." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      major: major || null,
      bio: bio || null,
      interests,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updated) {
    return { error: "Couldn't save your changes. Try again." };
  }

  refresh();
}

export async function deleteAccount(): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    console.error("delete_own_account failed", error);
    return { error: "Couldn't delete your account. Try again." };
  }

  await supabase.auth.signOut();
  redirect("/login");
}
