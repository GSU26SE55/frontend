import { AnalyticsDashboard } from "@/shared/components/analytics/AnalyticsDashboard";
import { useSiteList } from "@/features/manager/hooks/site/useSites";

// Thin wrapper: fetches the site list (manager) → passes it into the shared view.
export default function ManagerAnalyticsPage() {
  const { data } = useSiteList({ pageNumber: 1, pageSize: 100 });
  const sites = (data?.items ?? []).map((s) => ({ id: s.id, name: s.name }));
  return <AnalyticsDashboard sites={sites} />;
}
