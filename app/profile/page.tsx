
"use client";

import { useState } from "react";
import Link from "next/link";
import ProfilePhotoUpload from "@/components/profile-photo-upload";
import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  Heart,
  Clock,
  Save,
  Leaf,
} from "lucide-react";

const availableInterests = [
  "Technology",
  "Gaming",
  "Hiking",
  "Photography",
  "Sports",
  "Music",
  "Art",
  "Nature",
  "Studying",
  "Cars",
  "Fitness",
  "Food",
  "Movies",
  "Volunteering",
];

const availableTimes = [
  "Weekday Mornings",
  "Weekday Afternoons",
  "Weekday Evenings",
  "Weekends",
];

export default function ProfilePage() {
  const [name, setName] = useState("Demo Student");
  const [major, setMajor] = useState("Computer Science");
  const [bio, setBio] = useState(
    "Looking to meet new people and explore campus!"
  );

  const [interests, setInterests] = useState<string[]>([
    "Technology",
    "Gaming",
    "Hiking",
  ]);

  const [availability, setAvailability] = useState<string[]>([
    "Weekday Afternoons",
    "Weekends",
  ]);

  const [openToMeet, setOpenToMeet] = useState(true);
  const [saved, setSaved] = useState(false);

  function toggleItem(
    item: string,
    selected: string[],
    setSelected: (items: string[]) => void
  ) {
    setSelected(
      selected.includes(item)
        ? selected.filter((value) => value !== item)
        : [...selected, item]
    );
    setSaved(false);
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link
            href="/home"
            className="flex items-center gap-2 font-bold text-green-800"
          >
            <Leaf size={23} />
            De Anza Link
          </Link>

          <Link
            href="/home"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        {/* Profile heading */}
        <section>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="mt-2 text-gray-500">
            Let other students know a little about you.
          </p>
        </section>

        {/* Profile information */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <ProfilePhotoUpload name={name} />
            
            <div>
              <h2 className="text-xl font-semibold">{name}</h2>
              <p className="text-sm text-gray-500">
                De Anza College
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="student-name"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              <input
                id="student-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="major"
                className="mb-2 flex items-center gap-2 text-sm font-medium"
              >
                <GraduationCap size={17} />
                Major
              </label>

              <input
                id="major"
                value={major}
                onChange={(e) => {
                  setMajor(e.target.value);
                  setSaved(false);
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                placeholder="Your major"
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium"
              >
                About Me
              </label>

              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setSaved(false);
                }}
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-green-600"
                placeholder="Tell students about yourself..."
              />
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Heart className="text-green-700" size={21} />
            <h2 className="text-xl font-semibold">
              My Interests
            </h2>
          </div>

          <p className="mb-5 text-sm text-gray-500">
            Select your interests to find students and
            activities that match you.
          </p>

          <div className="flex flex-wrap gap-3">
            {availableInterests.map((interest) => {
              const selected = interests.includes(interest);

              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    toggleItem(
                      interest,
                      interests,
                      setInterests
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selected
                      ? "border-green-700 bg-green-700 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-green-400"
                  }`}
                >
                  {selected ? "✓ " : "+ "}
                  {interest}
                </button>
              );
            })}
          </div>
        </section>

        {/* Availability */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="text-green-700" size={21} />
            <h2 className="text-xl font-semibold">
              My Availability
            </h2>
          </div>

          <p className="mb-5 text-sm text-gray-500">
            When are you usually free to meet people?
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {availableTimes.map((time) => {
              const selected = availability.includes(time);

              return (
                <button
                  key={time}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    toggleItem(
                      time,
                      availability,
                      setAvailability
                    )
                  }
                  className={`rounded-xl border p-4 text-left text-sm transition ${
                    selected
                      ? "border-green-700 bg-green-50 font-semibold text-green-800"
                      : "border-gray-200 hover:border-green-400"
                  }`}
                >
                  {selected ? "✓ " : "+ "}
                  {time}
                </button>
              );
            })}
          </div>
        </section>

        {/* Meeting preferences */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Heart size={20} className="text-green-700" />
                Open to Meet
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Let other students know you're interested
                in making new friends.
              </p>
            </div>

            <input
              type="checkbox"
              aria-label="Open to Meet"
              checked={openToMeet}
              onChange={(e) => {
                setOpenToMeet(e.target.checked);
                setSaved(false);
              }}
              className="mt-1 h-5 w-5 accent-green-700"
            />
          </div>
        </section>

        {/* Save */}
        <button
          type="button"
          onClick={() => setSaved(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 px-6 py-4 font-semibold text-white hover:bg-green-900"
        >
          <Save size={19} />
          Save Changes
        </button>

        {saved && (
          <p role="status" className="text-center text-sm text-green-700">
            Changes saved in this preview only.
            Database integration is coming later.
          </p>
        )}
      </main>
    </div>
  );
}
