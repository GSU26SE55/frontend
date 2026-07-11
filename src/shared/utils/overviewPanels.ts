// Tên các panel (title của <DashboardPanel>) trong trang TỔNG QUAN (Overview) của 3 role.
// Đây là các panel bên trong trang mặc định theo role (/admin, /manager, /staff) —
// KHÔNG phải "section" của sidebar (Hạ tầng pin / Hỗ trợ / Người dùng).
// Gom về 1 nguồn để đổi tên panel chỉ sửa 1 chỗ, tránh hardcode rải rác 3 page.
// Dùng: title={OVERVIEW_PANELS.admin.alerts7d}

export const OVERVIEW_PANELS = {
  admin: {
    alerts7d: "Cảnh báo 7 ngày",
    alertsByType: "Cảnh báo theo loại",
    slaSystem: "Tuân thủ SLA hệ thống",
    batteryByStatus: "Pin theo trạng thái",
    usersByRole: "Người dùng theo vai trò",
    siteHealth: "Sức khỏe site",
    systemLog: "Nhật ký hệ thống",
  },
  manager: {
    ticketPipeline: "Pipeline xử lý ticket",
    sla: "Tuân thủ SLA",
    newTickets7d: "Ticket mới · 7 ngày",
    staffLoad: "Tải nhân sự",
    triageQueue: "Hàng chờ triage",
    sitesNeedAttention: "Sites cần chú ý",
  },
  staff: {
    personalSla: "Tuân thủ SLA cá nhân",
    tickets7d: "Ticket · 7 ngày",
    ticketStatus: "Trạng thái ticket",
    priority: "Ưu tiên xử lý",
    slaRisk: "Rủi ro SLA",
    recentNotifications: "Thông báo gần đây",
  },
} as const;
