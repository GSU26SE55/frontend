import type { GeoResult } from "@/shared/types/site/geocoding.types";

// Nominatim (OpenStreetMap) — free geocoding, no API key required.
// Called with plain `fetch` (NOT the app axios instance) on purpose: this is a
// third-party host, so it must NOT receive the app's Bearer token or baseURL.
// Usage policy: max ~1 req/s — callers debounce the query before hitting this.
const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchAddress(query: string): Promise<GeoResult[]> {
  const url =
    `${NOMINATIM_SEARCH}?format=jsonv2&limit=5&addressdetails=0` +
    `&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];

  const data = (await res.json()) as NominatimResult[];
  return data
    .map((d) => ({
      displayName: d.display_name,
      latitude: parseFloat(d.lat),
      longitude: parseFloat(d.lon),
    }))
    .filter((r) => !isNaN(r.latitude) && !isNaN(r.longitude));
}
