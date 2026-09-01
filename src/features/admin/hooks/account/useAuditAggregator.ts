import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { auditAggregatorService } from "@/features/admin/services/account/audit-aggregator.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AuditSearchParams,
  AuditStatsParams,
  AuditReplayPayload,
} from "@/features/admin/types/account/audit-aggregator.types";

export const useAuditSearch = (params?: AuditSearchParams) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.search(params),
    queryFn: () =>
      auditAggregatorService.search(params).then((r) => r.data.data),
  });

export const useAuditDetail = (eventId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.detail(eventId ?? ""),
    queryFn: () =>
      auditAggregatorService.getById(eventId!).then((r) => r.data.data),
    enabled: !!eventId,
  });

export const useAuditCorrelation = (correlationId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.correlation(correlationId ?? ""),
    queryFn: () =>
      auditAggregatorService
        .getByCorrelation(correlationId!)
        .then((r) => r.data.data),
    enabled: !!correlationId,
  });

export const useAuditAccountTimeline = (accountId?: string, limit = 100) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.accountTimeline(accountId ?? "", limit),
    queryFn: () =>
      auditAggregatorService
        .getAccountTimeline(accountId!, limit)
        .then((r) => r.data.data),
    enabled: !!accountId,
  });

export const useAuditStats = (params?: AuditStatsParams) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.stats(params),
    queryFn: () =>
      auditAggregatorService.getStats(params).then((r) => r.data.data),
  });

export const useAuditReplay = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload?: AuditReplayPayload) =>
      auditAggregatorService.replay(payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEY.auditAggregate] });
      toast.success(
        res.data.message || "Audit replay job initiated successfully.",
      );
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAuditReplayJob = (jobId?: string) =>
  useQuery({
    queryKey: QUERY_KEY.auditAggregate.replayJob(jobId ?? ""),
    queryFn: () =>
      auditAggregatorService.getReplayJob(jobId!).then((r) => r.data.data),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "Requested" || status === "InProgress") {
        return 3000;
      }
      return false;
    },
  });

export const useAuditRedact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => auditAggregatorService.redact(accountId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: [KEY.auditAggregate] });
      toast.success(
        res.data.message || "Account PII has been redacted from audit logs.",
      );
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
