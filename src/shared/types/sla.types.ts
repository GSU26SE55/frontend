export interface SlaRuleDto {
  id: string;
  priority: string;
  maxHours: number;
  warningPercent: number;
  updatedAt: string;
}

export interface UpdateSlaRulePayload {
  maxHours?: number;
  warningPercent?: number;
}
