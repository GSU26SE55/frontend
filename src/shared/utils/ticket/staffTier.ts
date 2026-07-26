// Rule tier PrimaryHandler theo priority ticket — mirror của BE
// `TicketService.Application.Common.Helpers.AssignmentRoleHelper`.
// Đây là bản sao ở FE để cảnh báo SỚM, KHÔNG thay thế check của BE:
// BE vẫn trả 403 nếu lọt qua. Sửa rule BE thì phải sửa file này theo.

import {
  StaffSkillTierEnum,
  StaffSkillTierLabel,
  StaffSkillTierShortLabel,
} from "@/shared/enums/account/staff-tier.enum";
import { TicketPriorityEnum } from "@/shared/enums/ticket/ticket.enum";

/**
 * Tier tối thiểu mà PrimaryHandler phải đạt.
 * P1 → Tier 3 · P2 → Tier 2 · P3 → Tier 1.
 * Trả `null` khi ticket chưa triage (priority null) — BE bỏ qua check tier
 * trong trường hợp này (`ticket.Priority.HasValue`), FE cũng không chặn.
 */
export function getMinTierForPriority(
  priority: TicketPriorityEnum | null | undefined,
): StaffSkillTierEnum | null {
  switch (priority) {
    case TicketPriorityEnum.P1Critical:
      return StaffSkillTierEnum.SeniorSpecialist;
    case TicketPriorityEnum.P2High:
      return StaffSkillTierEnum.ModuleSpecialist;
    case TicketPriorityEnum.P3Normal:
      return StaffSkillTierEnum.Generalist;
    default:
      return null;
  }
}

/**
 * Staff có đủ tier làm PrimaryHandler không.
 *
 * Fallback an toàn: `skillTier` undefined (BE chưa expose field) → trả `true`.
 * Thà để Manager thử và nhận 403 còn hơn khoá nhầm toàn bộ danh sách.
 */
export function isEligiblePrimaryHandler(
  skillTier: number | undefined,
  minTier: StaffSkillTierEnum | null,
): boolean {
  if (minTier === null || skillTier === undefined) return true;
  return skillTier >= minTier;
}

// Nhãn ngắn — khớp label của TicketPriorityBadge để Manager đối chiếu với badge trên ticket.
const PRIORITY_SHORT_LABEL: Record<TicketPriorityEnum, string> = {
  [TicketPriorityEnum.P1Critical]: "P1 · Nghiêm trọng",
  [TicketPriorityEnum.P2High]: "P2 · Cao",
  [TicketPriorityEnum.P3Normal]: "P3 · Bình thường",
};

/**
 * Nhãn 1 dòng cho option Staff trong dropdown: "Tên · Tier 2".
 * Bỏ phần tier khi BE chưa trả `skillTier` — không hiện "Tier undefined".
 */
export function staffOptionLabel(staff: {
  accountId: string;
  fullName?: string | null;
  skillTier?: number;
}): string {
  const name = staff.fullName ?? staff.accountId;
  if (staff.skillTier === undefined) return name;
  return `${name} · ${StaffSkillTierShortLabel[staff.skillTier] ?? `Tier ${staff.skillTier}`}`;
}

/** Câu nhắc hiển thị trong dialog gán/điều chuyển. `null` = không có ràng buộc. */
export function getTierRequirementHint(
  priority: TicketPriorityEnum | null | undefined,
): string | null {
  const minTier = getMinTierForPriority(priority);
  if (!priority || minTier === null) return null;
  return `Ticket ${PRIORITY_SHORT_LABEL[priority]} yêu cầu Staff phụ trách chính từ ${StaffSkillTierLabel[minTier]} trở lên.`;
}
