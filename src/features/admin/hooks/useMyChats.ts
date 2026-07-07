import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { myChatService } from "@/features/admin/services/my-chat.service";
import { KEY, QUERY_KEY } from "@/shared/utils/queryKeys";
import { handleErrorApi } from "@/shared/lib/errors";
import type { ChatListParams } from "@/shared/types/chat.types";

export const useMyChats = (params?: ChatListParams) =>
  useQuery({
    queryKey: QUERY_KEY.myChats.list(params),
    queryFn: () => myChatService.getMy(params).then((r) => r.data.data),
    staleTime: 30_000,
  });

export const useEraseMyChats = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => myChatService.eraseMyData(),
    onSuccess: () => {
      toast.success("Đã xóa dữ liệu chat cá nhân");
      qc.invalidateQueries({ queryKey: [KEY.myChats] });
    },
    onError: (error) => handleErrorApi({ error }),
  });
};
