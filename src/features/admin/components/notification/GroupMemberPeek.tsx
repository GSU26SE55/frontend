import { Loader2 } from "lucide-react";
import { useNotificationGroupMembers } from "@/features/admin/hooks/notification/useNotificationGroups";

interface Props {
  groupId: string;
  /** Số người nhận thực tế của nhóm — dùng để nói ra phần bị cắt khi danh sách dài. */
  memberCount: number;
}

/** Đủ để soát một nhóm bình thường mà không kéo cả nghìn dòng cho một ô xem nhanh. */
const PEEK_PAGE_SIZE = 50;

/**
 * Danh sách người trong một nhóm, hiện ngay dưới ô chọn nhóm ở form gửi hàng loạt.
 *
 * <b>Vì sao cần:</b> trước đây ô chọn nhóm chỉ hiện tên và một con số. Admin sắp gửi cho "Toàn bộ
 * Khách hàng" không có cách nào biết 2 người đó là ai nếu không mở sang màn hình khác — mà gửi
 * thông báo là việc không thu hồi được.
 *
 * <b>Vì sao chỉ tải khi mở:</b> component chỉ được render khi người dùng bấm mở, nên
 * <c>useNotificationGroupMembers</c> cũng chỉ gọi API lúc đó. Mở sẵn cả 5 nhóm là 5 lượt gọi thừa.
 *
 * <b>Vì sao vẫn hiện người đã ngừng hoạt động:</b> họ còn trong nhóm nhưng KHÔNG nhận thông báo —
 * đó chính là lý do số dòng ở đây có thể nhiều hơn con số người nhận bên cạnh tên nhóm. Ẩn đi thì
 * admin không hiểu vì sao hai số lệch nhau, và cũng không biết để dọn.
 */
export default function GroupMemberPeek({ groupId, memberCount }: Props) {
  const { data, isLoading, isError } = useNotificationGroupMembers(groupId, {
    pageNumber: 1,
    pageSize: PEEK_PAGE_SIZE,
  });

  if (isLoading) {
    return (
      <p className="flex items-center gap-1.5 px-2.5 pb-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Đang tải danh sách…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="px-2.5 pb-2 text-xs text-destructive">
        Không tải được danh sách người trong nhóm.
      </p>
    );
  }

  const members = data?.items ?? [];

  if (members.length === 0) {
    return (
      <p className="px-2.5 pb-2 text-xs text-muted-foreground italic">
        Nhóm chưa có ai.
      </p>
    );
  }

  const inactiveCount = members.filter((m) => !m.isActive).length;
  const total = data?.totalItems ?? members.length;
  const hidden = total - members.length;

  return (
    <div className="border-t border-border/60 px-2.5 py-1.5">
      <ul className="max-h-44 space-y-0.5 overflow-y-auto">
        {members.map((m) => (
          <li
            key={m.userId}
            className={`flex items-baseline gap-1.5 text-xs ${
              m.isActive ? "" : "opacity-50"
            }`}
          >
            <span className="truncate font-medium">{m.fullName}</span>
            <span className="truncate text-muted-foreground">{m.email}</span>
            {!m.isActive && (
              <span className="shrink-0 text-muted-foreground">
                · ngừng hoạt động
              </span>
            )}
          </li>
        ))}
      </ul>

      {inactiveCount > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          {inactiveCount} người đang ngừng hoạt động sẽ <b>không</b> nhận thông
          báo — đó là lý do con số bên cạnh tên nhóm ({memberCount}) nhỏ hơn số
          dòng ở đây.
        </p>
      )}

      {hidden > 0 && (
        <p className="mt-1 text-xs text-amber-600">
          Còn {hidden} người nữa chưa hiện — mở màn hình “Nhóm nhận thông báo” để
          xem đủ.
        </p>
      )}
    </div>
  );
}
