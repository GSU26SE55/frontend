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

// Nhóm đổi không thường xuyên, nhưng `memberCount` phụ thuộc trạng thái tài khoản (đồng bộ từ
// AuthService qua message bus) nên KHÔNG cache lâu như template — 1 phút là đủ để không nháy
// liên tục mà vẫn kịp thấy người mới được kích hoạt.
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
      toast.success(res.message ?? "Đã tạo nhóm.");
    },
    // KHÔNG bắt onError ở đây: form dùng try-catch + handleErrorApi({ error, setError }) để lỗi
    // 409 trùng tên hiện ngay dưới ô nhập thay vì trôi qua dưới dạng toast.
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
      toast.success(res.message ?? "Đã cập nhật nhóm.");
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
      toast.success(res.message ?? "Đã xoá nhóm.");
    },
    // Không có form → toast trực tiếp (quy ước fe.md).
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
      // Message của BE đã nói rõ bao nhiêu người bị bỏ qua và vì sao — hiện nguyên văn, vì
      // "đã thêm" chung chung sẽ khiến admin tưởng nhóm đã đủ người rồi gửi thiếu.
      const skipped =
        (res.data?.alreadyMembers ?? 0) + (res.data?.unknownAccounts ?? 0);
      if (skipped > 0) toast.warning(res.message ?? "Đã thêm thành viên.");
      else toast.success(res.message ?? "Đã thêm thành viên.");
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
      toast.success(res.message ?? "Đã bỏ khỏi nhóm.");
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

// ── Gửi hàng loạt ────────────────────────────────────────────────────────────────────────────

/**
 * Xem trước số người nhận. Là `useQuery` chứ không phải mutation vì kết quả chỉ phụ thuộc lựa
 * chọn hiện tại — đổi nhóm là truy vấn lại, và React Query tự huỷ lượt cũ nên không có chuyện
 * kết quả về trễ ghi đè con số mới.
 *
 * `enabled` khi chưa chọn gì thì tắt hẳn: gọi API với danh sách rỗng chỉ tốn một lượt đi về để
 * nhận lại số 0.
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
 * Xem trước NỘI DUNG theo từng kênh khi bật "dùng mẫu".
 *
 * Khác `useBroadcastPreview` (chỉ đếm người nhận): hook này trả về chữ mà mỗi kênh sẽ hiện. Phải
 * tách theo kênh vì mẫu khoá theo (Loại × Kênh) và bản SMS được nén ngắn riêng — một ô xem trước
 * duy nhất sẽ nói dối về các kênh còn lại.
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
      // KEY.notifications là chuỗi (khác các KEY.admin.* vốn là mảng) — bọc lại cho đúng kiểu.
      qc.invalidateQueries({ queryKey: [KEY.notifications] });
      toast.success(res.message ?? "Đã gửi thông báo.");
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

// Thống kê đã gửi/đã đọc thay đổi theo thời gian khi worker giao dần và người nhận mở ra, nên
// coi là luôn cũ và làm mới mỗi 15 giây trong lúc dialog còn mở.
export const useNotificationBatchDetail = (id: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEY.admin.notificationBatches.detail(id ?? ""),
    queryFn: () =>
      notificationBroadcastService.getBatchById(id!).then((r) => r.data.data),
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  });
