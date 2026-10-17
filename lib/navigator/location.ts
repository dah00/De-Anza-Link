import buildings from "@/data/buildings.json";

type Building = (typeof buildings)[number];

export function findBuilding(locationText: string): Building | null {
  const normalizedLocation = locationText.toLocaleLowerCase();

  return (
    buildings.find((building) =>
      [building.name, ...building.aliases].some((alias) =>
        normalizedLocation.includes(alias.toLocaleLowerCase()),
      ),
    ) ?? null
  );
}

export function getBuildingMapUrl(locationText: string): string | null {
  const building = findBuilding(locationText);
  if (!building) return null;

  return `https://www.google.com/maps/search/?api=1&query=${building.lat},${building.lng}`;
}
