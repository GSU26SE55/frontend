import type { EscalationReasonEnum } from "@/shared/types/ticket/ticket.types";

/**
 * Nhãn tiếng Việt cho lý do chuyển cấp.
 *
 * Đặt ở shared vì cả Manager (dialog chuyển cấp + sidebar) và Staff (sidebar) cùng dùng —
 * trước đây map này bị chép ở hai nơi trong feature manager, sửa một chỗ là hai chỗ lệch nhau.
 */
export const ESCALATION_REASON_LABEL: Record<EscalationReasonEnum, string> = {
  SkillGap: "Thiếu kỹ năng xử lý",
  PartsRequired: "Cần linh kiện thay thế",
  SafetyConcern: "Nguy cơ an toàn",
  SlaBreach: "Vi phạm SLA",
  CustomerComplaint: "Khách hàng khiếu nại",
};
