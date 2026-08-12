// A single address suggestion returned by the geocoding provider (Nominatim/OSM),
// normalized to the fields the app actually needs.
export interface GeoResult {
  /** Full human-readable address, e.g. "123 Nguyen Hue, District 1, Ho Chi Minh City". */
  displayName: string;
  latitude: number;
  longitude: number;
}
