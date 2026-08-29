import { useRouteError } from "react-router-dom";

/**
 * Bắt mọi lỗi thoát ra khỏi route. Trước đây không có, nên react-router in ra trang mặc định
 * của nó — kèm nguyên stack trace và câu "Hey developer 👋" — cho người dùng cuối nhìn thấy.
 *
 * Ca thường gặp nhất ở đây là chunk biến mất sau khi deploy: `lazyPage` đã tự tải lại một lần,
 * lỗi rơi tới đây nghĩa là lần đó cũng hỏng. Vẫn cho một nút bấm tay, vì tải lại thật sự là
 * cách chữa đúng — chỉ index.html mới biết danh sách hash chunk mới.
 */
export default function RouteErrorBoundary() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : String(error ?? "");
  // Vite/trình duyệt không có mã lỗi riêng cho ca này; chuỗi thông báo là thứ duy nhất phân biệt.
  const isStaleChunk =
    /dynamically imported module|Importing a module script failed|Failed to fetch/i.test(
      message,
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">
        {isStaleChunk ? "Đã có bản cập nhật mới" : "Trang gặp sự cố"}
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isStaleChunk
          ? "Ứng dụng vừa được cập nhật trong lúc bạn đang mở. Tải lại để dùng bản mới nhất."
          : "Đã có lỗi ngoài dự kiến. Tải lại trang hoặc quay lại sau ít phút."}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Tải lại trang
      </button>
      {import.meta.env.DEV && message ? (
        <pre className="max-w-full overflow-x-auto text-left text-xs text-muted-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}
