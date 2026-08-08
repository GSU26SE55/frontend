// Staff skill tier — mirrors StaffSkillTierEnum on the BE (AuthService + TicketService).
// Numeric values 1..3, comparable with >= to check "tier X or above".

export const StaffSkillTierEnum = {
  Generalist: 1,
  ModuleSpecialist: 2,
  SeniorSpecialist: 3,
} as const;
export type StaffSkillTierEnum =
  (typeof StaffSkillTierEnum)[keyof typeof StaffSkillTierEnum];

// The labels match the BE's 403 message verbatim
// (AssignmentRoleHelper.GetTierRequirementMessage) so a Manager can line the UI up
// with the error when something goes wrong.
export const StaffSkillTierLabel: Record<number, string> = {
  [StaffSkillTierEnum.Generalist]: "Generalist (Tier 1)",
  [StaffSkillTierEnum.ModuleSpecialist]: "ModuleSpecialist (Tier 2)",
  [StaffSkillTierEnum.SeniorSpecialist]: "SeniorSpecialist (Tier 3)",
};

/** Short label for the badge next to a staff member's name. */
export const StaffSkillTierShortLabel: Record<number, string> = {
  [StaffSkillTierEnum.Generalist]: "Tier 1",
  [StaffSkillTierEnum.ModuleSpecialist]: "Tier 2",
  [StaffSkillTierEnum.SeniorSpecialist]: "Tier 3",
};
