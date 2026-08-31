// SLA business calendar — GET/POST/PUT/DELETE /api/sla/non-working-periods (Manager, Admin).

/** One declared range of days that does not count towards any ticket's SLA. */
export interface SlaNonWorkingPeriodDto {
  id: string;
  /** ISO date, no time component — the BE models these as DateOnly. */
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
}

export interface SlaNonWorkingPeriodParams {
  pageNumber?: number;
  pageSize?: number;
  /** Keeps periods whose endDate is on/after this date. */
  from?: string;
  /** Keeps periods whose startDate is on/before this date. */
  to?: string;
  /** BE whitelist: startDate (default) | endDate | reason | createdAt. */
  sortBy?: string;
  sortDir?: string;
}

export interface SlaNonWorkingPeriodPayload {
  startDate: string;
  endDate: string;
  reason: string;
}
