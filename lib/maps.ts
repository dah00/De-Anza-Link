const CAMPUS_ADDRESS =
  "De Anza College, 21250 Stevens Creek Blvd, Cupertino, CA";

/** Google Maps and Apple Maps search links for an activity's location. */
export function mapLinks(location: string, address: string | null) {
  const query = encodeURIComponent(
    address ? `${location}, ${address}` : `${location}, ${CAMPUS_ADDRESS}`,
  );
  return {
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
    apple: `https://maps.apple.com/?q=${query}`,
  };
}
