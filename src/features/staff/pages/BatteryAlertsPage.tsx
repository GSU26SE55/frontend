import AlertsView from "@/shared/components/alerts/AlertsView";
import { useSiteList } from "@/features/staff/hooks/site/useSites";

export default function BatteryAlertsPage() {
  // Names the site on site-level alerts. GET /api/sites may still 403 for Staff — the
  // hook does not retry, `sites` stays undefined, and the row falls back to a shortened
  // id rather than breaking the dialog.
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <AlertsView
      subtitle="Staff · Alerts"
      basePath="/staff"
      sites={data?.items}
    />
  );
}
