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
    // "Trạng thái vận hành" = vòng đời nghiệp vụ (Active/Suspended/Decommissioned,
    // admin tự đặt tay), KHÔNG phải kết nối. Đặt tên rõ để khỏi mâu thuẫn thị giác
    // với panel "Pin còn kết nối" (online/offline) đứng ngay cạnh nó trên dashboard.
    batteryByStatus: "Pin theo trạng thái vận hành",
    topAlerting: "Pin cảnh báo nhiều nhất",
    siteHealth: "Sức khỏe site",
    telemetry24h: "Telemetry trung bình · 24h",
  },
  manager: {
    ticketPipeline: "Pipeline xử lý ticket",
    sla: "Tuân thủ SLA",
    priority: "Ticket theo ưu tiên",
    newTickets7d: "Ticket mới · 7 ngày",
    staffLoad: "Tải nhân sự",
    triageQueue: "Hàng chờ triage",
    sitesNeedAttention: "Sites cần chú ý",
    topAlerting: "Pin cảnh báo nhiều nhất",
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
