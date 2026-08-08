import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  notificationGroupService,
  notificationBroadcastService,
} from "@/features/admin/services/notification/notification-group.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  NotificationGroupListParams,
  NotificationGroupMemberListParams,
  CreateNotificationGroupPayload,
  UpdateNotificationGroupPayload,
  AddGroupMembersPayload,
  BroadcastPayload,
  BroadcastPreviewPayload,
  BroadcastTemplatePreviewPayload,
  NotificationBatchListParams,
} from "@/features/admin/types/notification/notification-group.types";

// Groups don't change often, but `memberCount` depends on account status (synced from
// AuthService via the message bus), so it should NOT be cached as long as templates — 1 minute is
// enough to avoid constant flicker while still seeing newly activated members promptly.
export const useNotificationGroups = (params?: NotificationGroupListParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationGroups.list(params),
    queryFn: () =>
      notificationGroupService.getList(params).then((r) => r.data.data),
    staleTime: 60_000,
  });

export const useNotificationGroupMembers = (
  groupId: string | undefined,
  params?: NotificationGroupMemberListParams,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationGroups.members(groupId ?? "", params),
    queryFn: () =>
      notificationGroupService
        .getMembers(groupId!, params)
        .then((r) => r.data.data),
    enabled: !!groupId,
    staleTime: 30_000,
  });

export const useCreateNotificationGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotificationGroupPayload) =>
      notificationGroupService.create(payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationGroups });
      toast.success(res.message ?? "Group created.");
    },
    // Do NOT catch onError here: the form uses try-catch + handleErrorApi({ error, setError }) so
    // a 409 duplicate-name error shows right under the input instead of drifting by as a toast.
  });
};

export const useUpdateNotificationGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNotificationGroupPayload;
    }) => notificationGroupService.update(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationGroups });
      toast.success(res.message ?? "Group updated.");
    },
  });
};

export const useDeleteNotificationGroup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      notificationGroupService.remove(id).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationGroups });
      toast.success(res.message ?? "Group deleted.");
    },
    // No form → toast directly (fe.md convention).
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAddGroupMembers = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AddGroupMembersPayload;
    }) => notificationGroupService.addMembers(id, payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationGroups });
      // BE's message already states how many people were skipped and why — show it verbatim, since
      // a generic "added" would make the admin think the group is fully staffed and send short.
      const skipped =
        (res.data?.alreadyMembers ?? 0) + (res.data?.unknownAccounts ?? 0);
      if (skipped > 0) toast.warning(res.message ?? "Members added.");
      else toast.success(res.message ?? "Members added.");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useRemoveGroupMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      notificationGroupService.removeMember(id, userId).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationGroups });
      toast.success(res.message ?? "Removed from group.");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// ── Broadcast send ────────────────────────────────────────────────────────────────────────────

/**
 * Preview the recipient count. This is a `useQuery`, not a mutation, because the result only
 * depends on the current selection — changing the group re-queries, and React Query cancels the
 * stale request automatically so a late response can never overwrite a newer count.
 *
 * `enabled` turns fully off when nothing is selected: calling the API with an empty list would
 * just spend a round trip to get back a 0.
 */
export const useBroadcastPreview = (
  payload: BroadcastPreviewPayload,
  enabled: boolean,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationBatches.preview(payload),
    queryFn: () =>
      notificationBroadcastService.preview(payload).then((r) => r.data.data),
    enabled,
    staleTime: 15_000,
  });

/**
 * Preview the CONTENT per channel when "use template" is enabled.
 *
 * Unlike `useBroadcastPreview` (which only counts recipients): this hook returns the actual text
 * each channel will show. Must be split by channel because templates are keyed by (Type × Channel)
 * and the SMS version is compressed separately — a single preview box would lie about the other channels.
 */
export const useBroadcastTemplatePreview = (
  payload: BroadcastTemplatePreviewPayload,
  enabled: boolean,
) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationBatches.templatePreview(payload),
    queryFn: () =>
      notificationBroadcastService
        .templatePreview(payload)
        .then((r) => r.data.data),
    enabled,
    staleTime: 15_000,
  });

export const useSendBroadcast = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BroadcastPayload) =>
      notificationBroadcastService.send(payload).then((r) => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEY.admin.notificationBatches });
      // KEY.notifications is a string (unlike the KEY.admin.* keys, which are arrays) — wrap it to match the type.
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
      toast.success(res.message ?? "Notification sent.");
    },
  });
};

export const useNotificationBatches = (params?: NotificationBatchListParams) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationBatches.list(params),
    queryFn: () =>
      notificationBroadcastService.getBatches(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

// Sent/read stats change over time as the worker delivers gradually and recipients open them, so
// treat it as always stale and refresh every 15 seconds while the dialog stays open.
export const useNotificationBatchDetail = (id: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationBatches.detail(id ?? ""),
    queryFn: () =>
      notificationBroadcastService.getBatchById(id!).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  });
