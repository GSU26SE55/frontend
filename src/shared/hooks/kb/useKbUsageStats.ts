import { useQuery } from "@tanstack/react-query";
import { kbUsageService } from "@/shared/services/kb/kb-usage.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";

/**
 * GET /api/knowledge-base/{id}/usage-stats (Manager/Admin).
 *
 * Pass an empty id to keep it idle — callers use that to fetch only while the dialog is
 * open, so opening a guide article does not cost a request nobody looks at.
 */
export function useKbUsageStats(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.usageStats(id),
    queryFn: () => kbUsageService.getUsageStats(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });
}
