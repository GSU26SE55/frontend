import { useQuery } from "@tanstack/react-query";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { searchAddress } from "@/shared/services/site/geocoding.service";

const MIN_QUERY_CHARS = 3;

/**
 * Geocoding suggestions for an address input. The caller passes an already-debounced
 * query — this hook only fires once it reaches MIN_QUERY_CHARS.
 */
export function useAddressSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: QUERY_KEY.geocode.search(trimmed),
    queryFn: () => searchAddress(trimmed),
    enabled: trimmed.length >= MIN_QUERY_CHARS,
    staleTime: 5 * 60_000,
  });
}
