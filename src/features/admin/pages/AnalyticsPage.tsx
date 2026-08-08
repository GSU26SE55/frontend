import { AnalyticsDashboard } from "@/shared/components/analytics/AnalyticsDashboard";
import { useSiteList } from "@/features/admin/hooks/site/useSites";

// Thin wrapper: fetch the site list (admin) → pass into the shared view.
export default function AdminAnalyticsPage() {
  const { data } = useSiteList({ pageNumber: 1, pageSize: 100 });
  const sites = (data?.items ?? []).map((s) => ({ id: s.id, name: s.name }));
  return <AnalyticsDashboard sites={sites} />;
}
