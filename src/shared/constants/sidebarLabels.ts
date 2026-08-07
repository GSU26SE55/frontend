// Label/title sidebar dùng CHUNG cho ≥2 role — 1 nguồn để đổi tên chỉ sửa 1 chỗ.
// Label/title đặc thù 1 role đặt ở features/{role}/config/{role}Nav.ts (không ở đây).
// Panel bên trong trang Tổng quan là OVERVIEW_PANELS (overviewPanels.ts) — khác thứ này.

// Tên app hiển thị ở header sidebar.
export const APP_NAME = "Solar Battery Management";

// Label menu item dùng ở ≥2 role.
export const SIDEBAR_LABELS = {
  overview: "Tổng quan",
  analytics: "Analytics",
  sites: "Battery & Site",
  tickets: "Tickets",
  knowledgeBase: "Knowledge Base",
  blog: "Blog",
  batteryAlerts: "Cảnh báo pin",
  envIncidents: "Sự cố môi trường",
  ambient: "Môi trường site",
  inbox: "Hộp thư",
  settings: "Cài đặt",
} as const;

// Path hộp thư — dùng chung mọi role (không có prefix /admin|/manager|/staff).
// AppLayout so khớp path này để gắn badge số chưa đọc, nên 3 nav config và AppLayout
// phải cùng tham chiếu một hằng: sửa path ở một nơi mà quên nơi kia thì badge im lặng biến mất.
export const INBOX_PATH = "/notifications";

// Title nhóm section dùng ở ≥2 role (chỉ "Hệ thống" trùng cả 3 role).
// Title section đặc thù ("Hạ tầng pin"/"Quản lý"/"Báo cáo"…) nằm trong {role}Nav.ts.
export const SIDEBAR_SECTION_TITLES = {
  system: "Hệ thống",
} as const;
