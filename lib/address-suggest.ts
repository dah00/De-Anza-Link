const DE_ANZA = { lat: 37.3196, lon: -122.045 };

const STATE_ABBR: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

const UA = "DeAnzaLink/1.0 (https://github.com/deanzalink)";

type PhotonFeature = {
  properties: {
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
};

type NominatimHit = {
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country_code?: string;
  };
};

function formatUsAddress(
  housenumber: string,
  street: string,
  city: string,
  state: string,
  postcode?: string,
) {
  const abbr = STATE_ABBR[state] ?? state;
  const region = postcode ? `${abbr} ${postcode}` : abbr;
  return `${housenumber} ${street}, ${city}, ${region}`;
}

function fromPhoton({ properties: p }: PhotonFeature): string | null {
  if (p.countrycode !== "US") return null;
  if (!p.housenumber || !p.street || !p.city || !p.state) return null;
  return formatUsAddress(
    p.housenumber,
    p.street,
    p.city,
    p.state,
    p.postcode,
  );
}

function fromNominatim(hit: NominatimHit): string | null {
  const a = hit.address;
  if (!a || a.country_code !== "us") return null;
  const city = a.city || a.town || a.village;
  if (!a.house_number || !a.road || !city || !a.state) return null;
  return formatUsAddress(a.house_number, a.road, city, a.state, a.postcode);
}

function unique(addresses: string[]) {
  return [...new Set(addresses)].slice(0, 5);
}

async function photon(q: string): Promise<string[]> {
  const params = new URLSearchParams({
    q,
    lat: String(DE_ANZA.lat),
    lon: String(DE_ANZA.lon),
    limit: "8",
    lang: "en",
    layer: "house",
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
    cache: "no-store",
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data: { features?: PhotonFeature[] } = await res.json();
  return unique((data.features ?? []).flatMap((f) => fromPhoton(f) ?? []));
}

async function nominatim(q: string): Promise<string[]> {
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "1",
    countrycodes: "us",
    limit: "5",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      cache: "no-store",
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    },
  );
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data: NominatimHit[] = await res.json();
  return unique(data.flatMap((hit) => fromNominatim(hit) ?? []));
}

/** Complete US street addresses near campus, or an empty list. */
export async function suggestAddresses(q: string): Promise<string[]> {
  const query = q.trim();
  if (query.length < 6 || !/\d/.test(query)) return [];

  try {
    const houses = await photon(query);
    if (houses.length > 0) return houses;
  } catch (err) {
    console.error("Photon address lookup failed", err);
  }

  try {
    return await nominatim(query);
  } catch (err) {
    console.error("Nominatim address lookup failed", err);
    throw new Error("Couldn't look up addresses.");
  }
}
