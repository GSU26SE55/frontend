import { useQuery } from "@tanstack/react-query";
import { staffKbService } from "../services/kb.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import type { KbArticleListParams } from "@/shared/types/kb.types";

export function useStaffKbList(params?: KbArticleListParams) {
  return useQuery({
    queryKey: QUERY_KEY.kb.list(params),
    queryFn: () => staffKbService.getList(params),
    select: (res) => res.data,
  });
}

export function useStaffKbDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEY.kb.detail(id),
    queryFn: () => staffKbService.getDetail(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}
