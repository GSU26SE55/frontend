// Tên các SECTION của sidebar (title nhóm menu trong <NavSection>) cho 3 role.
// Đây là các nhóm điều hướng bên trái (Hạ tầng pin / Hỗ trợ / Người dùng / Hệ thống…),
// KHÁC với <OVERVIEW_PANELS> — panel bên trong trang Tổng quan.
// Gom về 1 nguồn để đổi tên section chỉ sửa 1 chỗ, tránh hardcode rải rác trong AppLayout.
// Dùng: title: SIDEBAR_SECTIONS.admin.infrastructure

export const SIDEBAR_SECTIONS = {
  admin: {
    infrastructure: "Hạ tầng pin",
    support: "Hỗ trợ",
    users: "Người dùng",
    system: "Hệ thống",
  },
  manager: {
    management: "Quản lý",
    system: "Hệ thống",
  },
  staff: {
    reports: "Báo cáo",
    system: "Hệ thống",
  },
} as const;
