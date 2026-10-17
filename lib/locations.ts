export const CAMPUS_LOCATIONS = [
  "Campus Center",
  "Library",
  "Main Quad",
  "Sunken Garden",
  "Science Center",
  "Kirsch Center",
  "VPAC",
  "Fitness Center",
  "Track & Field",
] as const;

export type CampusLocation = (typeof CAMPUS_LOCATIONS)[number];

export function isCampusLocation(value: string): value is CampusLocation {
  return (CAMPUS_LOCATIONS as readonly string[]).includes(value);
}
