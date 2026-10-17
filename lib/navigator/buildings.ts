import buildings from "@/data/buildings.json";

export type CampusBuilding = (typeof buildings)[number];

export function matchBuilding(locationText: string): CampusBuilding | null {
  const normalizedLocation = locationText.toLocaleLowerCase();

  return (
    buildings.find((building) =>
      [building.name, ...building.aliases].some((alias) =>
        normalizedLocation.includes(alias.toLocaleLowerCase()),
      ),
    ) ?? null
  );
}

export function getCampusMapUrl(building: CampusBuilding): string {
  return `https://www.google.com/maps/search/?api=1&query=${building.lat},${building.lng}`;
}
