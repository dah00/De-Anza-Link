import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isInterest } from "@/lib/interests";
import { createClient } from "@/lib/supabase/server";
import { campusDayKey, campusTimeOfDay } from "@/lib/time";
import { CreateActivityForm } from "./create-form";

const HOUR = 60 * 60 * 1000;

export default function NewActivityPage({
  searchParams,
}: PageProps<"/activities/new">) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/activities"
        className="inline-flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Activities
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">Start an activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep it small and specific. People join what they can picture.
        </p>
      </div>
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-xl bg-muted" />}
      >
        <FormLoader searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FormLoader({
  searchParams,
}: {
  searchParams: PageProps<"/activities/new">["searchParams"];
}) {
  const { interest } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("interests")
    .eq("id", user.id)
    .single();
  const myInterests: string[] = (profile?.interests ?? []).filter(isInterest);

  const now = new Date();
  const nextHour = new Date(
    Math.ceil((now.getTime() + HOUR / 2) / HOUR) * HOUR,
  );
  const prefill = typeof interest === "string" && isInterest(interest);

  return (
    <CreateActivityForm
      myInterests={myInterests}
      today={campusDayKey(now)}
      defaults={{
        title: "",
        description: "",
        interest: prefill ? interest : (myInterests[0] ?? ""),
        day: campusDayKey(nextHour),
        time: campusTimeOfDay(nextHour),
        offCampus: false,
        location: "",
        address: "",
        minPeople: 2,
        maxPeople: 5,
      }}
    />
  );
}
