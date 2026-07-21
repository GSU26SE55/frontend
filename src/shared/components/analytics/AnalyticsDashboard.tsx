import { useState } from "react";
import { ReportGranularityEnum } from "@/shared/enums/dashboard/report.enum";
import type { AnalyticsFilter } from "@/shared/types/dashboard/analytics.types";
import { AnalyticsFilterBar, type SiteOption } from "./AnalyticsFilterBar";
import { ReportTabs } from "./ReportTabs";

// View Analytics dùng chung cho Admin & Manager. `sites` truyền từ page wrapper
// (mỗi feature dùng useSiteList riêng) để tránh cross-feature import.
export function AnalyticsDashboard({ sites }: { sites: SiteOption[] }) {
  const [filter, setFilter] = useState<AnalyticsFilter>({
    granularity: ReportGranularityEnum.Day,
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Analytics & Reports</h1>
        <p className="text-sm text-muted-foreground">
          Tổng quan pin và báo cáo vận hành — lọc theo site và khoảng thời gian.
        </p>
      </div>

      <AnalyticsFilterBar sites={sites} filter={filter} onChange={setFilter} />

      <ReportTabs filter={filter} />
    </div>
  );
}
