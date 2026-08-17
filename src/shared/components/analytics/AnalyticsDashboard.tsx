import { useState } from "react";
import { ReportGranularityEnum } from "@/shared/enums/dashboard/report.enum";
import type { AnalyticsFilter } from "@/shared/types/dashboard/analytics.types";
import { AnalyticsFilterBar, type SiteOption } from "./AnalyticsFilterBar";
import { ReportTabs } from "./ReportTabs";
import { RefreshButton } from "@/shared/components/ui/RefreshButton";
import { KEY } from "@/shared/utils/queryKeys";

// Analytics view shared by Admin & Manager. `sites` is passed in from the page wrapper
// (each feature uses its own useSiteList) to avoid a cross-feature import.
export function AnalyticsDashboard({ sites }: { sites: SiteOption[] }) {
  const [filter, setFilter] = useState<AnalyticsFilter>({
    granularity: ReportGranularityEnum.Day,
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto min-h-full">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-1">
            Battery overview and operational reports — filter by site and date
            range.
          </p>
        </div>
        <RefreshButton queryKeys={[KEY.reports]} />
      </div>

      <AnalyticsFilterBar sites={sites} filter={filter} onChange={setFilter} />

      <ReportTabs filter={filter} />
    </div>
  );
}
