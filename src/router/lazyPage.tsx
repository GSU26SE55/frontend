import { lazy, type ComponentType } from "react";

/** Cờ chống lặp: chỉ cho phép tải lại MỘT lần cho mỗi tab. */
const RELOAD_FLAG = "chunkReloadedOnce";

function session(op: (s: Storage) => void) {
  // Chế độ riêng tư / cookie bị chặn làm sessionStorage ném ngay ở lúc đọc.
  try {
    op(window.sessionStorage);
  } catch {
    /* không có storage thì bỏ qua — chỉ mất khả năng chống lặp */
  }
}

/**
 * `lazy()` có thêm khả năng tự phục hồi sau khi deploy.
 *
 * Vì sao cần: tên file chunk nhúng hash nội dung, nên bản deploy sau sinh ra tên MỚI và xoá tên
 * cũ. Tab nào đang mở app lúc đó vẫn giữ index.html cũ trong bộ nhớ, và lần đầu điều hướng sang
 * một trang chưa từng vào sẽ đi tải một chunk không còn tồn tại. Người dùng thấy trang trắng,
 * còn F5 thì hết — đúng cái triệu chứng khó tả nhất khi nhận báo lỗi.
 *
 * Tải lại trang là cách chữa duy nhất: chỉ có index.html mới mới biết danh sách hash mới.
 * Chỉ thử MỘT lần, vì nếu chunk hỏng vì lý do khác (mạng chết, file lỗi thật) thì reload vô hạn
 * còn tệ hơn trang trắng — lần thứ hai để lỗi nổi lên error boundary.
 */
export function lazyPage<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await load();
      // Vào được là chunk hiện tại lành ⇒ mở lại quyền reload cho lần deploy sau.
      session((s) => s.removeItem(RELOAD_FLAG));
      return mod;
    } catch (error) {
      let alreadyTried = true;
      session((s) => {
        alreadyTried = s.getItem(RELOAD_FLAG) !== null;
        if (!alreadyTried) s.setItem(RELOAD_FLAG, "1");
      });
      if (alreadyTried) throw error;

      window.location.reload();
      // Treo vĩnh viễn: reload() không dừng luồng hiện tại, trả về đây sẽ khiến React kịp
      // render error boundary trong lúc trình duyệt đang điều hướng — chớp một cái trang lỗi.
      return new Promise<never>(() => {});
    }
  });
}
