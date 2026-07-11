// Text empty/error theo khuôn — hàm template nhận tên resource.
// Gom để mọi list/table dùng chung 1 câu chữ nhất quán.
// Dùng: <ErrorState message={loadFailed("bài viết")} /> · <EmptyState title={noData("site")} />

/** "Không thể tải danh sách {resource}." — dùng cho ErrorState khi query lỗi. */
export const loadFailed = (resource: string) =>
  `Không thể tải danh sách ${resource}.`;

/** "Chưa có {resource} nào." — dùng cho EmptyState khi list rỗng. */
export const noData = (resource: string) => `Chưa có ${resource} nào.`;

/** "Không tìm thấy {resource} phù hợp." — dùng khi filter/search không ra kết quả. */
export const notFound = (resource: string) =>
  `Không tìm thấy ${resource} phù hợp.`;

/** Câu mặc định khi không rõ resource. */
export const LOAD_FAILED_DEFAULT = "Không thể tải dữ liệu. Vui lòng thử lại.";
export const NO_DATA_DEFAULT = "Chưa có dữ liệu.";
