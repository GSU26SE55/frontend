// Tier kỹ năng của Staff — khớp StaffSkillTierEnum bên BE (AuthService + TicketService).
// Giá trị số 1..3, so sánh được bằng >= để check "từ tier X trở lên".

export const StaffSkillTierEnum = {
  Generalist: 1,
  ModuleSpecialist: 2,
  SeniorSpecialist: 3,
} as const;
export type StaffSkillTierEnum =
  (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];

// Đặt label khớp nguyên văn message 403 của BE (AssignmentRoleHelper.GetTierRequirementMessage)
// để Manager đối chiếu được UI với lỗi khi có sự cố.
export const StaffSkillTierLabel: Record<number, string> = {
  [StaffSkillTierEnum.Generalist]: "Generalist (Tier 1)",
  [StaffSkillTierEnum.ModuleSpecialist]: "ModuleSpecialist (Tier 2)",
  [StaffSkillTierEnum.SeniorSpecialist]: "SeniorSpecialist (Tier 3)",
};

/** Nhãn ngắn cho badge cạnh tên staff. */
export const StaffSkillTierShortLabel: Record<number, string> = {
  [StaffSkillTierEnum.Generalist]: "Tier 1",
  [StaffSkillTierEnum.ModuleSpecialist]: "Tier 2",
  [StaffSkillTierEnum.SeniorSpecialist]: "Tier 3",
};
