import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ticketChatService } from "@/features/admin/services/ticket/ticket-chat.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type {
  ChatListParams,
  CreateChatPayload,
  UpdateChatPayload,
  ChatMarkReadPayload,
} from "@/shared/types/chat/chat.types";
import type { ReactionTypeEnum } from "@/shared/enums/ticket/reaction.enum";
import { ADMIN_MESSAGES } from "@/features/admin/constants/messages";

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
      ticketChatService.getReactions(ticketId, chatId).then((r) => r.data.data),
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
      toast.success(ADMIN_MESSAGES.ticket.messageDeleted);
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
      reactionType,
    }: {
      ticketId: string;
      chatId: string;
      reactionType: ReactionTypeEnum;
    }) =>
      ticketChatService
        .addReaction(ticketId, chatId, reactionType)
        .then((r) => r.data.data),
    // BE returns the latest aggregate → write it straight to the cache: the person who reacted sees the change instantly,
    // without waiting for a refetch. SignalR ReactionChanged handles syncing for other clients.
    onSuccess: (data, { ticketId, chatId }) => {
      if (data) {
        qc.setQueryData(
          QUERY_KEY.tickets.chatReactions(ticketId, chatId),
          data,
        );
      }
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
      reactionType,
    }: {
      ticketId: string;
      chatId: string;
      reactionType: ReactionTypeEnum;
    }) =>
      ticketChatService
        .removeReaction(ticketId, chatId, reactionType)
        .then((r) => r.data.data),
    onSuccess: (data, { ticketId, chatId }) => {
      if (data) {
        qc.setQueryData(
          QUERY_KEY.tickets.chatReactions(ticketId, chatId),
          data,
        );
      }
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
      onFailed?: () => void;
    }) => ticketChatService.markRead(ticketId, payload),
    onSuccess: (_, { ticketId }) => {
      // Same 1.5s delay as the shared useMarkTicketChatsRead, and for the same reason: a 200
      // only means the receipts were QUEUED. TicketService persists them from
      // ChatReadReceiptBulkWriter on a 1s flush interval, so refetching immediately reads the
      // database before the flush, gets the old count back and marks the query fresh — the
      // badge then holds a stale number instead of clearing.
      setTimeout(() => {
        qc.invalidateQueries({
          queryKey: QUERY_KEY.tickets.chatUnreadCount(ticketId),
        });
        qc.invalidateQueries({ queryKey: QUERY_KEY.tickets.chats(ticketId) });
        qc.invalidateQueries({ queryKey: [KEY.myChats] });
      }, 1_500);
    },
    // Mark-read is background housekeeping the user never asked for → stay silent, no toast.
    // onFailed hands the ids back to the thread so the next render retries them; BE answers
    // 503 when its read-receipt queue is full, exactly the case worth retrying.
    onError: (_error, { onFailed }) => onFailed?.(),
  });
};
