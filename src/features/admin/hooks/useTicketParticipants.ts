import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketParticipantService } from "@/features/admin/services/ticket-participant.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  AddParticipantPayload,
  BulkAddParticipantsPayload,
  UpdateParticipantPayload,
  RemoveParticipantPayload,
} from "@/shared/types/ticket-participant.types";

export const useTicketParticipants = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ticketParticipants.list(ticketId),
    queryFn: () =>
      ticketParticipantService.getList(ticketId).then((r) => r.data.data),
    enabled: !!ticketId,
  });

export const useParticipantsHistory = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEY.ticketParticipants.history(ticketId),
    queryFn: () =>
      ticketParticipantService.getHistory(ticketId).then((r) => r.data.data),
    enabled: !!ticketId,
  });

export const useAddParticipant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: AddParticipantPayload;
    }) => ticketParticipantService.add(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã thêm thành viên");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketParticipants.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useBulkAddParticipants = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: BulkAddParticipantsPayload;
    }) => ticketParticipantService.bulkAdd(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã thêm thành viên");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketParticipants.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useUpdateParticipant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      userId,
      payload,
    }: {
      ticketId: string;
      userId: string;
      payload: UpdateParticipantPayload;
    }) => ticketParticipantService.update(ticketId, userId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã cập nhật quyền thành viên");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketParticipants.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useRemoveParticipant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      userId,
      payload,
    }: {
      ticketId: string;
      userId: string;
      payload?: RemoveParticipantPayload;
    }) => ticketParticipantService.remove(ticketId, userId, payload),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã xóa thành viên");
      qc.invalidateQueries({
        queryKey: QUERY_KEY.ticketParticipants.list(ticketId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useLeaveTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) =>
      ticketParticipantService.leave(ticketId),
    onSuccess: (_, ticketId) => {
      toast.success("Đã rời ticket");
      qc.invalidateQueries({ queryKey: [KEY.ticketParticipants] });
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
