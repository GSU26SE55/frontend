import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { auditAggregatorService } from "@/features/admin/services/audit-aggregator.service";
import { QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AuditSearchParams,
  AuditReplayParams,
  AuditRedactParams,
} from "@/shared/types/audit-aggregate.types";

export const useAuditSearch = (params?: AuditSearchParams, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.search(params),
    queryFn: () =>
      auditAggregatorService.search(params).then((r) => r.data.data),
    staleTime: 30_000,
    enabled,
  });

export const useAuditDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.detail(id),
    queryFn: () =>
      auditAggregatorService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useAuditByCorrelation = (corrId: string) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.correlation(corrId),
    queryFn: () =>
      auditAggregatorService.getByCorrelation(corrId).then((r) => r.data.data),
    enabled: !!corrId,
  });

export const useAuditAccountTimeline = (accountId: string, limit?: number) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.accountTimeline(accountId, limit),
    queryFn: () =>
      auditAggregatorService
        .getAccountTimeline(accountId, limit)
        .then((r) => r.data.data),
    enabled: !!accountId,
  });

export const useAuditStats = (params?: object, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.stats(params),
    queryFn: () =>
      auditAggregatorService.getStats(params).then((r) => r.data.data),
    staleTime: 5 * 60_000,
    enabled,
  });

export const useExportAudit = () =>
  useMutation({
    mutationFn: ({
      params,
      format,
    }: {
      params?: object;
      format?: "csv" | "xlsx";
    }) => auditAggregatorService.export(params, format),
    onError: (error) => handleErrorApi({ error }),
  });

export const useReplayAudit = () =>
  useMutation({
    mutationFn: (payload: AuditReplayParams) =>
      auditAggregatorService.replay(payload),
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu replay event");
    },
    onError: (error) => handleErrorApi({ error }),
  });

export const useRedactAudit = () =>
  useMutation({
    mutationFn: (payload: AuditRedactParams) =>
      auditAggregatorService.redact(payload),
    onSuccess: () => {
      toast.success("Đã xóa dữ liệu cá nhân");
    },
    onError: (error) => handleErrorApi({ error }),
  });
