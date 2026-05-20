import { useQuery } from '@tanstack/react-query';
import { managerSiteService } from '@/features/manager/services/site.service';
import { QUERY_KEY } from '@/shared/utils/queryKeys';
import type { SiteFilterParams, SiteAssetsFilterParams } from '@/shared/types/site.types';

export const useSiteList = (params?: SiteFilterParams) =>
  useQuery({
    queryKey: QUERY_KEY.sites.list(params),
    queryFn:  () => managerSiteService.getList(params).then((r) => r.data.data),
  });

export const useSiteDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.sites.detail(id),
    queryFn:  () => managerSiteService.getById(id).then((r) => r.data.data),
    enabled:  !!id,
  });

export const useSiteDashboard = (id: string) =>
  useQuery({
    queryKey:  QUERY_KEY.sites.dashboard(id),
    queryFn:   () => managerSiteService.getDashboard(id).then((r) => r.data.data),
    enabled:   !!id,
    staleTime: 60_000, // dashboard stats — 1 min per fe.md; healthScore/alerts affect safety
  });

export const useSiteAssets = (siteId: string, params?: SiteAssetsFilterParams) =>
  useQuery({
    queryKey: QUERY_KEY.sites.assets(siteId, params),
    queryFn:  () => managerSiteService.getAssets(siteId, params).then((r) => r.data.data),
    enabled:  !!siteId,
  });
