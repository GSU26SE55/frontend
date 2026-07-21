import { AnalyticsDashboard } from "@/shared/components/analytics/AnalyticsDashboard";
import { useSiteList } from "@/features/admin/hooks/site/useSites";

// Wrapper mỏng: lấy danh sách site (admin) → truyền vào view dùng chung.
export default function AdminAnalyticsPage() {
  const { data } = useSiteList({ pageNumber: 1, pageSize: 100 });
  const sites = (data?.items ?? []).map((s) => ({ id: s.id, name: s.name }));
  return <AnalyticsDashboard sites={sites} />;
}
