export interface TicketReportParams {
  from?: string;
  to?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface SlaByStaffDto {
  staffId: string;
  staffName: string;
  totalTickets: number;
  breachedCount: number;
  breachRate: number;
  avgResolutionHours: number;
}

export interface SlaByPriorityDto {
  priority: string;
  totalTickets: number;
  breachedCount: number;
  breachRate: number;
  avgResolutionHours: number;
}

export interface TicketVolumeDto {
  date: string;
  created: number;
  resolved: number;
  escalated: number;
}

export interface TopReopenIssueDto {
  categoryId: string;
  categoryName: string;
  reopenCount: number;
  avgReopenPerTicket: number;
}

export interface StaffPerformanceDto {
  staffId: string;
  staffName: string;
  assignedCount: number;
  resolvedCount: number;
  avgResolutionHours: number;
  csatAvg: number | null;
}

export interface CsatDto {
  date: string;
  averageScore: number;
  responseCount: number;
}

export interface ResolutionHistogramDto {
  bucketLabel: string;
  count: number;
}

export interface CategoryBreakdownDto {
  categoryId: string;
  categoryName: string;
  ticketCount: number;
  percentage: number;
}

export interface SagaFailedRateDto {
  sagaType: string;
  totalRuns: number;
  failedCount: number;
  failRate: number;
}
