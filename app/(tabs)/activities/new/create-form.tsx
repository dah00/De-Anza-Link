"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createActivity, type NewActivity } from "@/lib/activity-actions";
import { INTEREST_GROUPS } from "@/lib/interests";
import { CAMPUS_LOCATIONS } from "@/lib/locations";
import { cn } from "@/lib/utils";
import { AddressSearch } from "./address-search";

const MAX_PEOPLE_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-base outline-none focus-visible:border-foreground/40";

export function CreateActivityForm({
  myInterests,
  today,
  defaults,
}: {
  myInterests: string[];
  today: string;
  defaults: NewActivity;
}) {
  const [form, setForm] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [addressPicked, setAddressPicked] = useState(false);
  const [lookupFailed, setLookupFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof NewActivity>(key: K, value: NewActivity[K]) => {
    setError(null);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.offCampus && !addressPicked && !lookupFailed) {
      setError("Pick an address from the list so people can find it.");
      return;
    }
    startTransition(async () => {
      const result = await createActivity(form);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What are you doing?
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Psych coffee before class"
          maxLength={80}
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        What&apos;s it about?
        <select
          value={form.interest}
          onChange={(e) => set("interest", e.target.value)}
          className={fieldClass}
          required
        >
          <option value="" disabled>
            Pick one
          </option>
          {myInterests.length > 0 && (
            <optgroup label="Your interests">
              {myInterests.map((interest) => (
                <option key={`mine-${interest}`} value={interest}>
                  {interest}
                </option>
              ))}
            </optgroup>
          )}
          {INTEREST_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.interests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Day
          <Input
            type="date"
            value={form.day}
            min={today}
            onChange={(e) => set("day", e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Time
          <Input
            type="time"
            value={form.time}
            step={900}
            onChange={(e) => set("time", e.target.value)}
            required
          />
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">Where</legend>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
          {[
            { offCampus: false, label: "On campus" },
            { offCampus: true, label: "Somewhere else" },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={form.offCampus === option.offCampus}
              onClick={() => {
                setError(null);
                setAddressPicked(false);
                setLookupFailed(false);
                setForm((f) =>
                  f.offCampus === option.offCampus
                    ? f
                    : {
                        ...f,
                        offCampus: option.offCampus,
                        location: "",
                        address: "",
                      },
                );
              }}
              className={cn(
                "rounded-md py-1.5 transition-colors",
                form.offCampus === option.offCampus
                  ? "bg-card font-medium shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {form.offCampus ? (
          <>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Place name, e.g. Memorial Park courts"
              aria-label="Place name"
              maxLength={80}
              required
            />
            <AddressSearch
              value={form.address}
              onType={(value) => {
                setAddressPicked(false);
                set("address", value);
              }}
              onPick={(suggestion) => {
                setAddressPicked(true);
                setLookupFailed(false);
                set("address", suggestion.address);
              }}
              onLookupFailed={() => setLookupFailed(true)}
            />
            <p className="text-xs text-muted-foreground">
              {lookupFailed
                ? "Couldn't look up addresses. Type a public street address — no home addresses."
                : "Type a US street address and pick one. Public place only, no home addresses."}
            </p>
          </>
        ) : (
          <select
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={fieldClass}
            aria-label="Campus spot"
            required
          >
            <option value="" disabled>
              Pick a spot
            </option>
            {CAMPUS_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Max people
          <select
            value={form.maxPeople}
            onChange={(e) => set("maxPeople", Number(e.target.value))}
            className={fieldClass}
          >
            {MAX_PEOPLE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>
          Details{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </span>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Anything people should know or bring?"
          maxLength={500}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-foreground/40"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-11 text-base"
        disabled={pending}
      >
        {pending ? "Posting..." : "Post activity"}
      </Button>
      <p className="-mt-1 text-center text-xs text-muted-foreground">
        You&apos;ll be the first person going, and you count toward max people.
      </p>
    </form>
  );
}
