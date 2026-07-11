// Tên các section (title của <DashboardPanel>) cho 3 dashboard theo role.
// Gom về 1 nguồn để đổi tên section chỉ sửa 1 chỗ, tránh hardcode rải rác 3 page.
// Dùng: title={DASHBOARD_SECTIONS.admin.alerts7d}

export const DASHBOARD_SECTIONS = {
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
