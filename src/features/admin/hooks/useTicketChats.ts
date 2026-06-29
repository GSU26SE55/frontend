import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketChatService } from "@/features/admin/services/ticket-chat.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  ChatListParams,
  CreateChatPayload,
  UpdateChatPayload,
  ChatMarkReadPayload,
} from "@/shared/types/chat.types";

export const useTicketChats = (ticketId: string, params?: ChatListParams) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chats(ticketId),
    queryFn: () =>
      ticketChatService.getList(ticketId, params).then((r) => r.data.data),
    enabled: !!ticketId,
    staleTime: 60_000,
  });

export const useTicketChatDetail = (ticketId: string, chatId: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chatDetail(ticketId, chatId),
    queryFn: () =>
      ticketChatService.getById(ticketId, chatId).then((r) => r.data.data),
    enabled: !!ticketId && !!chatId,
  });

export const useTicketChatReplies = (ticketId: string, chatId: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chatReplies(ticketId, chatId),
    queryFn: () =>
      ticketChatService.getReplies(ticketId, chatId).then((r) => r.data.data),
    enabled: !!ticketId && !!chatId,
  });

export const useChatReactions = (ticketId: string, chatId: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chatReactions(ticketId, chatId),
    queryFn: () =>
      ticketChatService
        .getReactions(ticketId, chatId)
        .then((r) => r.data.data),
    enabled: !!ticketId && !!chatId,
  });

export const useChatReaders = (ticketId: string, chatId: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chatReaders(ticketId, chatId),
    queryFn: () =>
      ticketChatService.getReaders(ticketId, chatId).then((r) => r.data.data),
    enabled: !!ticketId && !!chatId,
  });

export const useChatUnreadCount = (ticketId: string) =>
  useQuery({
    queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
    queryFn: () =>
      ticketChatService.getUnreadCount(ticketId).then((r) => r.data.data),
    enabled: !!ticketId,
    staleTime: 30_000,
  });

export const useCreateChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: CreateChatPayload;
    }) => ticketChatService.create(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useUpdateChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      payload,
    }: {
      ticketId: string;
      chatId: string;
      payload: UpdateChatPayload;
    }) => ticketChatService.update(ticketId, chatId, payload),
    onSuccess: (_, { ticketId, chatId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatDetail(ticketId, chatId),
      });
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useDeleteChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      reason,
    }: {
      ticketId: string;
      chatId: string;
      reason?: string;
    }) => ticketChatService.remove(ticketId, chatId, reason),
    onSuccess: (_, { ticketId }) => {
      toast.success("Đã xóa tin nhắn");
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAddReply = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      payload,
    }: {
      ticketId: string;
      chatId: string;
      payload: CreateChatPayload;
    }) => ticketChatService.addReply(ticketId, chatId, payload),
    onSuccess: (_, { ticketId, chatId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatReplies(ticketId, chatId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const usePinChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, chatId }: { ticketId: string; chatId: string }) =>
      ticketChatService.pin(ticketId, chatId),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useUnpinChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, chatId }: { ticketId: string; chatId: string }) =>
      ticketChatService.unpin(ticketId, chatId),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useAddReaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      emoji,
    }: {
      ticketId: string;
      chatId: string;
      emoji: string;
    }) => ticketChatService.addReaction(ticketId, chatId, emoji),
    onSuccess: (_, { ticketId, chatId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatReactions(ticketId, chatId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useRemoveReaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      chatId,
      emoji,
    }: {
      ticketId: string;
      chatId: string;
      emoji: string;
    }) => ticketChatService.removeReaction(ticketId, chatId, emoji),
    onSuccess: (_, { ticketId, chatId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatReactions(ticketId, chatId),
      });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};

export const useMarkChatsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      payload,
    }: {
      ticketId: string;
      payload: ChatMarkReadPayload;
    }) => ticketChatService.markRead(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
      });
      qc.invalidateQueries({ queryKey: [KEY.myChats] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
