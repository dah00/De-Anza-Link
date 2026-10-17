export const INTEREST_GROUPS = [
  {
    label: "Sports & fitness",
    interests: [
      "Soccer",
      "Basketball",
      "Volleyball",
      "Tennis",
      "Badminton",
      "Pickleball",
      "Running",
      "Swimming",
      "Fitness",
      "Yoga",
      "Hiking",
      "Cycling",
      "Martial Arts",
      "Skateboarding",
    ],
  },
  {
    label: "Hobbies",
    interests: [
      "Gaming",
      "Board Games",
      "Chess",
      "Music",
      "Singing",
      "Dance",
      "Art",
      "Photography",
      "Film",
      "Anime",
      "Reading",
      "Writing",
      "Cooking",
      "Baking",
      "Thrifting",
    ],
  },
  {
    label: "Majors & classes",
    interests: [
      "Psychology",
      "Computer Science",
      "Engineering",
      "Biology",
      "Chemistry",
      "Physics",
      "Math",
      "Nursing",
      "Business",
      "Economics",
      "Accounting",
      "Political Science",
      "Sociology",
      "Communications",
      "Graphic Design",
      "Languages",
    ],
  },
  {
    label: "Topics",
    interests: [
      "AI & Tech",
      "Startups",
      "Sustainability",
      "Mental Health",
      "Volunteering",
      "Career & Internships",
      "Transfer Prep",
      "Study Groups",
      "Travel",
      "Fashion",
      "Coffee & Boba",
      "Food Spots",
    ],
  },
] as const;

export type Interest = (typeof INTEREST_GROUPS)[number]["interests"][number];

export const INTERESTS: readonly Interest[] = INTEREST_GROUPS.flatMap(
  (group) => group.interests,
);

export function isInterest(value: string): value is Interest {
  return (INTERESTS as readonly string[]).includes(value);
}
