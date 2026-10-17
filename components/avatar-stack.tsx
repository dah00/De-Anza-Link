import type { Person } from "@/lib/activities";
import { Avatar } from "./avatar";

export function AvatarStack({
  people,
  max = 4,
}: {
  people: Person[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((person) => (
        <Avatar
          key={person.id}
          name={person.displayName}
          photoUrl={person.photoUrl}
          className="ring-2 ring-card"
        />
      ))}
      {extra > 0 && (
        <span className="relative inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

/** "You, Maya and 2 others" */
export function goingNames(people: Person[], myId: string) {
  const youreGoing = people.some((p) => p.id === myId);
  const names = [
    ...(youreGoing ? ["You"] : []),
    ...people
      .filter((p) => p.id !== myId)
      .map((p) => p.displayName.split(" ")[0]),
  ];
  if (names.length === 0) return "No one yet";
  if (names.length <= 2) return names.join(" and ");
  const rest = names.length - 2;
  return `${names.slice(0, 2).join(", ")} and ${rest} ${rest === 1 ? "other" : "others"}`;
}
