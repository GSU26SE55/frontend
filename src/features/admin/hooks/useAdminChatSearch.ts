import { useQuery } from "@tanstack/react-query";
import {
  adminChatSearchService,
  type AdminChatSearchParams,
} from "@/features/admin/services/admin-chat-search.service";
import { KEY } from "@/shared/utils/queryKeys";

export const useAdminChatSearch = (
  params?: AdminChatSearchParams,
  enabled = true,
) =>
  useQuery({
    queryKey: [KEY.myChats, "admin-search", params],
    queryFn: () =>
      adminChatSearchService.search(params).then((r) => r.data.data),
    staleTime: 30_000,
    enabled,
  });
