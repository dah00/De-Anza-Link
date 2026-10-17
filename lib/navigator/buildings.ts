import buildings from "@/data/buildings.json";

export type CampusBuilding = (typeof buildings)[number];

// Lowercase, turn "&" into "and", and strip punctuation so that
// "Student & Community Services" and "student and community services" match.
function normalize(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Build the alias list once. Single-character aliases (like "g") are ignored
// because they match inside ordinary words.
const aliasIndex = buildings.flatMap((building) =>
  [building.name, ...building.aliases]
    .map(normalize)
    .filter((alias) => alias.length >= 2)
    .map((alias) => ({ alias, building })),
);

export function matchBuilding(locationText: string): CampusBuilding | null {
  // Padding with spaces makes the check match whole words only.
  const text = ` ${normalize(locationText)} `;
  let best: { building: CampusBuilding; length: number } | null = null;

  for (const { alias, building } of aliasIndex) {
    if (!text.includes(` ${alias} `)) continue;
    // Prefer the longest (most specific) alias that matched.
    if (!best || alias.length > best.length) {
      best = { building, length: alias.length };
    }
  }

  return best?.building ?? null;
}

export function getCampusMapUrl(building: CampusBuilding): string {
  return `https://www.google.com/maps/search/?api=1&query=${building.lat},${building.lng}`;
}