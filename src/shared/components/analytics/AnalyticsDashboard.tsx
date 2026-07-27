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
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Analytics & Reports</h1>
        <p className="text-xs lg:text-sm text-muted-foreground mt-1">
          Tổng quan pin và báo cáo vận hành — lọc theo site và khoảng thời gian.
        </p>
      </div>

      <AnalyticsFilterBar sites={sites} filter={filter} onChange={setFilter} />

      <ReportTabs filter={filter} />
    </div>
  );
}
