import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { chatTemplateService } from "@/features/admin/services/chat-template.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  CreateChatTemplatePayload,
  UpdateChatTemplatePayload,
  ChatTemplateListParams,
} from "@/shared/types/chat-template.types";

export const useChatTemplates = (params?: ChatTemplateListParams) =>
  useQuery({
    queryKey: QUERY_KEY.chatTemplates.list(params),
    queryFn: () =>
      chatTemplateService.getList(params).then((r) => r.data.data),
    staleTime: 5 * 60_000,
  });

export const useChatTemplate = (id: string) =>
  useQuery({
    queryKey: QUERY_KEY.chatTemplates.detail(id),
    queryFn: () => chatTemplateService.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateChatTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChatTemplatePayload) =>
      chatTemplateService.create(payload),
    onSuccess: () => {
      toast.success("Đã tạo template");
      qc.invalidateQueries({ queryKey: [KEY.chatTemplates] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useUpdateChatTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateChatTemplatePayload;
    }) => chatTemplateService.update(id, payload),
    onSuccess: () => {
      toast.success("Đã cập nhật template");
      qc.invalidateQueries({ queryKey: [KEY.chatTemplates] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useDeleteChatTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatTemplateService.remove(id),
    onSuccess: () => {
      toast.success("Đã xóa template");
      qc.invalidateQueries({ queryKey: [KEY.chatTemplates] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
