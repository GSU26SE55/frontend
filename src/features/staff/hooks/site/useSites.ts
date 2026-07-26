import { useQuery } from "@tanstack/react-query";
import { staffSiteService } from "@/features/staff/services/site/site.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { SiteFilterParams } from "@/shared/types/site/site.types";

// Site list cho Staff — dùng để chọn SiteId khi report sự cố môi trường thủ công.
// ⚠️ Cần BE mở GET /api/sites cho role Staff (trước đó là Admin,Manager → Staff nhận 403).
// Khi BE chưa deploy: query lỗi → `sites` undefined → nút report tự ẩn (degrade an toàn).
export const useSiteList = (params?: SiteFilterParams) =>
  useQuery({
    queryKey: QUERY_KEY.sites.list(params),
    queryFn: () => staffSiteService.getList(params).then((r) => r.data.data),
    staleTime: 5 * 60_000, // site list đổi chậm — 5 phút per fe.md
    retry: false, // 403 khi BE chưa deploy → không retry vô ích
  });
