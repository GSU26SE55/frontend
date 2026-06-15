import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminSiteService } from "@/features/admin/services/site.service";
import { handleErrorApi } from "@/shared/lib/errors";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import type {
  SiteFilterParams,
  SiteAssetsFilterParams,
  SiteCreatePayload,
  SiteUpdatePayload,
} from "@/shared/types/site.types";

export const useSiteList = (params?: SiteFilterParams) =>
  useQuery({
    queryKey: QUERY_KEY.sites.list(params),
    queryFn: () => adminSiteService.getList(params).then((r) => r.data.data),
  });

export const useSiteDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.sites.detail(id),
    queryFn: () => adminSiteService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useSiteDashboard = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.sites.dashboard(id),
    queryFn: () => adminSiteService.getDashboard(id).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 60_000, // dashboard stats — 1 min per fe.md; healthScore/alerts affect safety
  });

export const useSiteAssets = (
  siteId: string,
  params?: SiteAssetsFilterParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.sites.assets(siteId, params),
    queryFn: () =>
      adminSiteService.getAssets(siteId, params).then((r) => r.data.data),
    enabled: !!siteId,
  });

export const useCreateSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SiteCreatePayload) =>
      adminSiteService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.sites] });
    },
  });
};

export const useUpdateSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SiteUpdatePayload }) =>
      adminSiteService.update(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY.sites] });
      qc.invalidateQueries({ queryKey: QUERY_KEY.sites.detail(id) });
    },
  });
};

export const useDeleteSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminSiteService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.sites] });
      toast.success("Đã xoá site");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useRestoreSite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminSiteService.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY.sites] });
      toast.success("Đã khôi phục site");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
