import AlertsView from "@/shared/components/alerts/AlertsView";
import { useSiteList } from "@/features/manager/hooks/site/useSites";

export default function AlertsPage() {
  // Names the site on site-level alerts. Same arrangement as EnvironmentalIncidentsPage:
  // the site list is fetched per portal because shared/ cannot import a feature hook.
  const { data } = useSiteList({ pageSize: 100 });
  return (
    <AlertsView
      subtitle="Manager · Alerts"
      basePath="/manager"
      sites={data?.items}
    />
  );
}
