import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import { staffTicketService } from "../services/ticket.service";
import type {
  HoldTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  AddCommentRequest,
  AddMaintenanceLogRequest,
  UpdateMaintenanceLogRequest,
} from "../types/staff-ticket.types";

function useTicketMutation<TData>(
  mutationFn: (data: TData) => Promise<unknown>,
  ticketId: string,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
      queryClient.invalidateQueries({ queryKey: [KEY.staffTickets, "list"] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useStartTicket(ticketId: string) {
  return useTicketMutation(
    () => staffTicketService.start(ticketId),
    ticketId,
    "Đã bắt đầu xử lý ticket",
  );
}

export function useHoldTicket(ticketId: string) {
  return useTicketMutation(
    (data: HoldTicketRequest) => staffTicketService.hold(ticketId, data),
    ticketId,
    "Đã tạm dừng ticket",
  );
}

export function useResumeTicket(ticketId: string) {
  return useTicketMutation(
    () => staffTicketService.resume(ticketId),
    ticketId,
    "Đã tiếp tục xử lý ticket",
  );
}

export function useResolveTicket(ticketId: string) {
  return useTicketMutation(
    (data: ResolveTicketRequest) => staffTicketService.resolve(ticketId, data),
    ticketId,
    "Đã báo hoàn thành ticket",
  );
}

export function useEscalateTicket(ticketId: string) {
  return useTicketMutation(
    (data: EscalateTicketRequest) =>
      staffTicketService.escalateRequest(ticketId, data),
    ticketId,
    "Đã gửi yêu cầu chuyển cấp",
  );
}

export function useAddComment(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCommentRequest) =>
      staffTicketService.addComment(ticketId, data),
    onSuccess: () => {
      toast.success("Đã thêm bình luận");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useAddMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddMaintenanceLogRequest) =>
      staffTicketService.addMaintenanceLog(ticketId, data),
    onSuccess: () => {
      toast.success("Đã thêm nhật ký bảo trì");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}

export function useUpdateMaintenanceLog(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      logId,
      data,
    }: {
      logId: string;
      data: UpdateMaintenanceLogRequest;
    }) => staffTicketService.updateMaintenanceLog(ticketId, logId, data),
    onSuccess: () => {
      toast.success("Đã cập nhật nhật ký bảo trì");
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.detail(ticketId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEY.staffTickets.myMaintenanceLogs(),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
}
